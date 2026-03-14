#!/usr/bin/env node
/**
 * cli.ts
 * Commander-based CLI entry point for wallpaper-organizer.
 */

import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import path from "path";
import fs from "fs";
import { scanImages } from "./scanner.js";
import { organizeImages, FileResult } from "./organizer.js";
import { listCategories } from "./classify.js";

const program = new Command();

program
  .name("wo")
  .description(
    "Organize wallpaper images into folders by resolution or aspect ratio.\n" +
    "Default output: organized/<resolution>/images  (e.g. organized/1080p/images)\n" +
    "With --by-ratio: organized/<ratio>/images       (e.g. organized/wide/images)"
  )
  .version("1.0.0");

program
  .argument("<source>", "Source directory containing images")
  .argument("[output]", "Output directory (default: <source>/organized)")
  .option("-m, --mode <mode>", 'Action to perform: "copy" or "move"', "copy")
  .option("-r, --recursive", "Recurse into sub-directories to find images", false)
  .option("--dry-run", "Preview what would happen without writing any files", false)
  .option("--by-ratio", "Group by aspect ratio instead of resolution (e.g. wide, ultrawide)", false)
  .option("-v, --verbose", "Log every file as it is processed", false)
  .option("--count", "Count images in the source directory and exit (no organizing)", false)
  .option("--list-categories", "Print all possible output category folders and exit", false)
  .action(async (source: string, outputArg: string | undefined, opts) => {
    // ------------------------------------------------------------------ setup
    const sourceDir = path.resolve(source);
    const outputDir = outputArg
      ? path.resolve(outputArg)
      : path.join(sourceDir, "organized");

    const mode      = opts.mode as "copy" | "move";
    const dryRun    = opts.dryRun as boolean;
    const byRatio   = opts.byRatio as boolean;
    const verbose   = opts.verbose as boolean;
    const recursive = opts.recursive as boolean;

    // ---------------------------------------------------------------- --list-categories
    if (opts.listCategories) {
      console.log(chalk.bold("\nAvailable output categories:\n"));
      listCategories(byRatio).forEach((c) => console.log("  ", chalk.cyan(c)));
      console.log();
      process.exit(0);
    }
    // ---------------------------------------------------------------- --count
    if (opts.count) {
      console.log();
      console.log(chalk.bold.cyan("  🖼  Wallpaper Organizer — Count"));
      console.log(chalk.dim("  ─────────────────────────────────────────────"));
      console.log(`  ${chalk.bold("Source :")} ${sourceDir}`);
      console.log(`  ${chalk.bold("Recurse:")} ${recursive ? "yes" : "no"}`);
      console.log(chalk.dim("  ─────────────────────────────────────────────"));
      console.log();

      const countSpinner = ora("Counting images…").start();
      let files: string[];
      try {
        files = await scanImages({ sourceDir, recursive });
      } catch (err) {
        countSpinner.fail(`Scan failed: ${err}`);
        process.exit(1);
      }
      countSpinner.stop();

      if (files.length === 0) {
        console.log(chalk.dim("  No image files found."));
        console.log();
        process.exit(0);
      }

      // Count by extension
      const extCounts: Record<string, number> = {};
      for (const f of files) {
        const ext = path.extname(f).slice(1).toLowerCase();
        extCounts[ext] = (extCounts[ext] ?? 0) + 1;
      }

      const sorted = Object.entries(extCounts).sort(([a], [b]) => a.localeCompare(b));
      const maxExt = Math.max(...sorted.map(([e]) => e.length));
      for (const [ext, count] of sorted) {
        console.log(
          `  ${chalk.cyan(("." + ext).padEnd(maxExt + 3))}` +
          `${chalk.bold(count)} file${count !== 1 ? "s" : ""}`
        );
      }

      console.log(chalk.dim("  ─────────────────────────────────────────────"));
      console.log(`  ${chalk.bold("Total  :")} ${chalk.bold.green(files.length)} image${files.length !== 1 ? "s" : ""}`);
      console.log();
      process.exit(0);
    }

    if (!fs.existsSync(sourceDir)) {
      console.error(chalk.red(`\n✖  Source directory not found: ${sourceDir}\n`));
      process.exit(1);
    }
    if (!fs.statSync(sourceDir).isDirectory()) {
      console.error(chalk.red(`\n✖  Source is not a directory: ${sourceDir}\n`));
      process.exit(1);
    }
    if (mode !== "copy" && mode !== "move") {
      console.error(chalk.red(`\n✖  --mode must be "copy" or "move", got: ${mode}\n`));
      process.exit(1);
    }

    // ---------------------------------------------------------------- header
    console.log();
    console.log(chalk.bold.cyan("  🖼  Wallpaper Organizer"));
    console.log(chalk.dim("  ─────────────────────────────────────────────"));
    console.log(`  ${chalk.bold("Source :")} ${sourceDir}`);
    console.log(`  ${chalk.bold("Output :")} ${outputDir}`);
    console.log(`  ${chalk.bold("Mode   :")} ${mode}${dryRun ? chalk.yellow("  (dry run — no files written)") : ""}`);
    console.log(`  ${chalk.bold("Recurse:")} ${recursive ? "yes" : "no"}`);
    console.log(`  ${chalk.bold("Group  :")} ${byRatio ? "by ratio (e.g. wide, ultrawide)" : "by resolution (e.g. 1080p, 4K)"}`);
    console.log(chalk.dim("  ─────────────────────────────────────────────"));
    console.log();

    // ---------------------------------------------------------------- scan
    const scanSpinner = ora("Scanning for images…").start();
    let files: string[];
    try {
      files = await scanImages({
        sourceDir,
        recursive,
        excludeDirs: [outputDir],
      });
    } catch (err) {
      scanSpinner.fail(`Scan failed: ${err}`);
      process.exit(1);
    }

    if (files.length === 0) {
      scanSpinner.warn("No image files found.");
      console.log();
      process.exit(0);
    }
    scanSpinner.succeed(`Found ${chalk.bold(files.length)} image${files.length !== 1 ? "s" : ""}`);
    console.log();

    // ---------------------------------------------------------------- organize
    const folderCounts: Record<string, number> = {};
    const errors: FileResult[] = [];

    const mainSpinner = ora(`${mode === "copy" ? "Copying" : "Moving"} images…`).start();

    const summary = await organizeImages(
      { files, outputDir, mode, dryRun, byRatio },
      (result, index) => {
        if (result.status === "ok") {
          folderCounts[result.folder] = (folderCounts[result.folder] ?? 0) + 1;
          if (verbose) {
            mainSpinner.clear();
            const icon = dryRun ? chalk.dim("[dry]") : chalk.green("✔");
            const dim = `${result.width}×${result.height}`;
            console.log(
              `  ${icon} ${chalk.dim(path.relative(sourceDir, result.src))}  ${chalk.cyan("→")}  ${chalk.cyan(result.folder)}  ${chalk.dim(dim)}`
            );
          } else {
            mainSpinner.text = `[${index + 1}/${files.length}] ${path.basename(result.src)}`;
          }
        } else if (result.status === "error") {
          errors.push(result);
          if (verbose) {
            mainSpinner.clear();
            console.log(`  ${chalk.red("✖")} ${chalk.dim(path.relative(sourceDir, result.src))}  ${chalk.red(result.error ?? "")}`);
          }
        }
      }
    );

    mainSpinner.succeed(
      `Done! Processed ${chalk.bold(summary.processed)} file${summary.processed !== 1 ? "s" : ""}` +
      (summary.errors > 0 ? chalk.yellow(` (${summary.errors} errors)`) : "")
    );

    // ---------------------------------------------------------------- summary table
    console.log();
    console.log(chalk.bold("  Output breakdown:"));
    console.log(chalk.dim("  ─────────────────────────────────────────────"));

    const sortedFolders = Object.entries(folderCounts).sort(([a], [b]) => a.localeCompare(b));
    if (sortedFolders.length === 0) {
      console.log(chalk.dim("  (nothing to show)"));
    } else {
      const maxWidth = Math.max(...sortedFolders.map(([f]) => f.length));
      for (const [folder, count] of sortedFolders) {
        const bar = "█".repeat(Math.ceil((count / summary.processed) * 20));
        console.log(
          `  ${chalk.cyan(folder.padEnd(maxWidth + 2))}` +
          `${chalk.green(bar)}  ${chalk.bold(count)} file${count !== 1 ? "s" : ""}`
        );
      }
    }

    if (errors.length > 0) {
      console.log();
      console.log(chalk.bold.red("  Errors:"));
      errors.slice(0, 10).forEach((r) => {
        console.log(`  ${chalk.red("✖")} ${path.relative(sourceDir, r.src)}: ${r.error}`);
      });
      if (errors.length > 10) {
        console.log(chalk.dim(`  … and ${errors.length - 10} more`));
      }
    }

    if (dryRun) {
      console.log();
      console.log(chalk.yellow("  ⚠  Dry run — no files were actually written."));
    }

    console.log();
  });

program.parse(process.argv);
