import { afterEach, describe, expect, it } from "vitest";
import { mkdtempSync, mkdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const projectDir = path.resolve(__dirname, "..");
const temporaryDirs: string[] = [];

afterEach(() => {
  for (const directory of temporaryDirs.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

function runScript(scriptName: string, failCommand = "", withNpm = true) {
  const directory = realpathSync(mkdtempSync(path.join(tmpdir(), "wallpaper installer ")));
  temporaryDirs.push(directory);
  const binDir = path.join(directory, "bin");
  mkdirSync(binDir);
  const logFile = path.join(directory, "npm.log");
  writeFileSync(logFile, "");
  if (withNpm) {
    writeFileSync(
      path.join(binDir, "npm"),
      '#!/bin/bash\nprintf "%s:%s\\n" "$PWD" "$*" >> "$INSTALL_TEST_LOG"\n' +
        'if [ "$*" = "$INSTALL_TEST_FAIL" ]; then exit 42; fi\n',
      { mode: 0o755 },
    );
  }
  const result = spawnSync("/bin/bash", [path.join(projectDir, scriptName)], {
    cwd: directory,
    encoding: "utf8",
    env: {
      ...process.env,
      PATH: withNpm ? `${binDir}${path.delimiter}${process.env.PATH}` : binDir,
      INSTALL_TEST_LOG: logFile,
      INSTALL_TEST_FAIL: failCommand,
    },
  });
  return { ...result, directory, calls: readFileSync(logFile, "utf8").trim().split("\n").filter(Boolean) };
}

describe("global installer", () => {
  it("installs, builds, and links from the project directory when invoked elsewhere", () => {
    const result = runScript("install.sh");
    expect(result.status, result.stderr).toBe(0);
    expect(result.calls).toEqual([
      `${projectDir}:ci`,
      `${projectDir}:run build`,
      `${projectDir}:link`,
    ]);
    expect(result.stdout).toContain("wo --help");
  });

  it.each<[string, string[]]>([
    ["ci", ["ci"]],
    ["run build", ["ci", "run build"]],
    ["link", ["ci", "run build", "link"]],
  ])("stops and preserves the exit code when npm %s fails", (command, calls) => {
    const result = runScript("install.sh", command);
    expect(result.status).toBe(42);
    expect(result.calls).toEqual(calls.map((call) => `${projectDir}:${call}`));
    expect(result.stdout).not.toContain("wo --help");
  });
});

describe("global uninstaller", () => {
  it("removes only this global package when invoked from another directory", () => {
    const result = runScript("uninstall.sh");
    expect(result.status, result.stderr).toBe(0);
    expect(result.calls).toEqual([`${result.directory}:unlink --global wallpaper-organizer`]);
    expect(result.stdout).toContain("Uninstalled");
    expect(readFileSync(path.join(projectDir, "package.json"), "utf8")).toContain('"wallpaper-organizer"');
  });

  it("preserves npm's exit code and does not report success on failure", () => {
    const result = runScript("uninstall.sh", "unlink --global wallpaper-organizer");
    expect(result.status).toBe(42);
    expect(result.stdout).not.toContain("Uninstalled");
  });

  it("explains when npm is missing", () => {
    const result = runScript("uninstall.sh", "", false);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Missing npm");
    expect(result.calls).toEqual([]);
  });
});
