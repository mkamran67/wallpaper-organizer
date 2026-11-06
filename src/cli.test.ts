import { afterEach, describe, expect, it } from "vitest";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import sharp from "sharp";

const entryPoint = path.resolve(__dirname, "index.ts");
const tsxLoader = pathToFileURL(require.resolve("tsx")).href;
const temporaryDirs: string[] = [];

afterEach(() => {
  for (const directory of temporaryDirs.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

async function fixture() {
  const directory = mkdtempSync(path.join(tmpdir(), "wallpaper devices "));
  temporaryDirs.push(directory);
  const source = path.join(directory, "source");
  const nested = path.join(source, "nested");
  mkdirSync(nested, { recursive: true });
  const images = [
    { file: path.join(source, "wide.png"), width: 192, height: 108, category: "desktop" },
    { file: path.join(source, "square.png"), width: 100, height: 100, category: "desktop" },
    { file: path.join(nested, "tall.png"), width: 108, height: 192, category: "portrait" },
  ];
  for (const image of images) {
    await sharp({ create: { width: image.width, height: image.height, channels: 3, background: "#123456" } })
      .png().toFile(image.file);
  }
  return { directory, source, images };
}

function run(directory: string, args: string[]) {
  return spawnSync(process.execPath, ["--import", tsxLoader, entryPoint, ...args], {
    cwd: directory,
    encoding: "utf8",
    env: { ...process.env, NO_COLOR: "1", FORCE_COLOR: "0" },
  });
}

describe("device grouping CLI", () => {
  it.each([
    { flags: [], folders: ["SD"] },
    { flags: ["--by-ratio"], folders: ["portrait", "square", "wide"] },
  ])("preserves grouping with flags $flags", async ({ flags, folders }) => {
    const { directory, source } = await fixture();
    const result = run(directory, [source, "--recursive", ...flags]);
    expect(result.status, result.stderr).toBe(0);
    expect(readdirSync(path.join(source, "organized")).sort()).toEqual(folders);
  });

  it("copies desktop, square, and recursively found portrait images into device folders", async () => {
    const { directory, source, images } = await fixture();
    const result = run(directory, [source, "--by-device", "--recursive"]);
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain("by device");
    const output = path.join(source, "organized");
    expect(readdirSync(output).sort()).toEqual(["desktop", "portrait"]);
    for (const image of images) {
      expect(readFileSync(path.join(output, image.category, path.basename(image.file))))
        .toEqual(readFileSync(image.file));
    }
  });

  it("previews device grouping without creating folders or moving sources", async () => {
    const { directory, source, images } = await fixture();
    const result = run(directory, [source, "--by-device", "--recursive", "--mode", "move", "--dry-run", "--verbose"]);
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain("desktop");
    expect(result.stdout).toContain("portrait");
    expect(existsSync(path.join(source, "organized"))).toBe(false);
    for (const image of images) expect(existsSync(image.file)).toBe(true);
  });

  it("moves images into a custom output directory", async () => {
    const { directory, source, images } = await fixture();
    const output = path.join(directory, "device output");
    const originals = images.map(image => readFileSync(image.file));
    const result = run(directory, [source, output, "--by-device", "--recursive", "--mode", "move"]);
    expect(result.status, result.stderr).toBe(0);
    for (const [index, image] of images.entries()) {
      expect(readFileSync(path.join(output, image.category, path.basename(image.file)))).toEqual(originals[index]);
      expect(existsSync(image.file)).toBe(false);
    }
  });

  it("lists device folders", async () => {
    const { directory, source } = await fixture();
    const result = run(directory, [source, "--by-device", "--list-categories"]);
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain("desktop");
    expect(result.stdout).toContain("portrait");
    expect(result.stdout).not.toContain("1080p");
    expect(existsSync(path.join(source, "organized"))).toBe(false);
  });

  it("rejects combining device and ratio grouping before touching images", async () => {
    const { directory, source, images } = await fixture();
    const result = run(directory, [source, "--by-device", "--by-ratio", "--mode", "move"]);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/cannot.*--by-device.*--by-ratio/i);
    expect(existsSync(path.join(source, "organized"))).toBe(false);
    for (const image of images) expect(existsSync(image.file)).toBe(true);
  });
});
