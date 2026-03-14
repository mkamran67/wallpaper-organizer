/**
 * scanner.ts
 * Recursively discovers image files in a directory using fast-glob.
 */

import fg from "fast-glob";
import path from "path";

const IMAGE_EXTENSIONS = [
  "jpg", "jpeg", "png", "webp", "tiff", "tif", "bmp", "gif", "avif",
];

export interface ScanOptions {
  /** Root directory to scan */
  sourceDir: string;
  /** Whether to recurse into sub-directories (default: false) */
  recursive: boolean;
  /** Directories to exclude (absolute paths or glob patterns) */
  excludeDirs?: string[];
}

/**
 * Returns an array of absolute paths to image files found under `sourceDir`.
 */
export async function scanImages(options: ScanOptions): Promise<string[]> {
  const { sourceDir, recursive, excludeDirs = [] } = options;

  const depth = recursive ? Infinity : 1;

  // Build ignore patterns from excluded dirs
  const ignore = excludeDirs.map((d) => {
    const rel = path.relative(sourceDir, d);
    return `${rel}/**`;
  });

  const patterns = IMAGE_EXTENSIONS.map((ext) => {
    if (recursive) {
      return `**/*.${ext}`;
    }
    // Non-recursive: only files directly inside sourceDir
    return `*.${ext}`;
  });

  const files = await fg(patterns, {
    cwd: sourceDir,
    absolute: true,
    caseSensitiveMatch: false,
    ignore,
    deep: recursive ? undefined : 1,
    followSymbolicLinks: true,
  });

  return files.sort();
}
