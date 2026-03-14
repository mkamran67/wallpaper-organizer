/**
 * organizer.ts
 * Reads each image's dimensions via sharp, classifies it, then copies or moves
 * it to the destination folder.
 */

import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import sharp from "sharp";
import { classifyImage } from "./classify.js";

export type Mode = "copy" | "move";

export interface OrganizerOptions {
  /** Source image file paths to process */
  files: string[];
  /** Root output directory */
  outputDir: string;
  /** "copy" (default) or "move" */
  mode: Mode;
  /** If true, don't write anything — just report what would happen */
  dryRun: boolean;
  /** If true, group by aspect ratio instead of resolution */
  byRatio: boolean;
}

export interface FileResult {
  src: string;
  dest: string;
  folder: string;
  width: number;
  height: number;
  status: "ok" | "skipped" | "error";
  error?: string;
}

export interface OrganizerSummary {
  results: FileResult[];
  totalFiles: number;
  processed: number;
  skipped: number;
  errors: number;
}

/**
 * Resolve a conflict-free destination path.
 * If `dest` already exists, appends _1, _2, … until a free name is found.
 */
function resolveDestPath(dest: string, dryRun: boolean, seen: Set<string>): string {
  if (!seen.has(dest) && (dryRun || !fs.existsSync(dest))) {
    seen.add(dest);
    return dest;
  }

  const ext  = path.extname(dest);
  const base = dest.slice(0, dest.length - ext.length);
  let counter = 1;
  let candidate: string;
  do {
    candidate = `${base}_${counter}${ext}`;
    counter++;
  } while (seen.has(candidate) || (!dryRun && fs.existsSync(candidate)));

  seen.add(candidate);
  return candidate;
}

/**
 * Organizes all given image files into the output directory.
 * Calls `onProgress` for each file processed.
 */
export async function organizeImages(
  options: OrganizerOptions,
  onProgress?: (result: FileResult, index: number, total: number) => void
): Promise<OrganizerSummary> {
  const { files, outputDir, mode, dryRun, byRatio } = options;

  const results: FileResult[] = [];
  const seen = new Set<string>(); // tracks dest paths this session

  for (let i = 0; i < files.length; i++) {
    const src = files[i];
    let result: FileResult;

    try {
      // Read dimensions
      const meta = await sharp(src).metadata();
      const width  = meta.width  ?? 0;
      const height = meta.height ?? 0;

      if (!width || !height) {
        result = { src, dest: "", folder: "", width: 0, height: 0, status: "skipped", error: "Cannot read dimensions" };
      } else {
        const classification = classifyImage(width, height);
        const category = byRatio ? classification.ratioFolder : classification.resFolder;
        const folderKey = category;

        const destDir  = path.join(outputDir, folderKey);
        const fileName = path.basename(src);
        const rawDest  = path.join(destDir, fileName);
        const dest     = resolveDestPath(rawDest, dryRun, seen);

        if (!dryRun) {
          await fsp.mkdir(destDir, { recursive: true });
          if (mode === "copy") {
            await fsp.copyFile(src, dest);
          } else {
            // Try rename first (fast within same filesystem), fall back to copy+unlink
            try {
              await fsp.rename(src, dest);
            } catch {
              await fsp.copyFile(src, dest);
              await fsp.unlink(src);
            }
          }
        }

        result = { src, dest, folder: folderKey, width, height, status: "ok" };
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      result = { src, dest: "", folder: "", width: 0, height: 0, status: "error", error: msg };
    }

    results.push(result);
    onProgress?.(result, i, files.length);
  }

  return {
    results,
    totalFiles: files.length,
    processed: results.filter((r) => r.status === "ok").length,
    skipped:   results.filter((r) => r.status === "skipped").length,
    errors:    results.filter((r) => r.status === "error").length,
  };
}
