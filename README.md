# 🖼 Wallpaper Organizer

A fast CLI tool that scans a folder of wallpaper images and sorts them into subfolders based on **aspect ratio** and **resolution tier** — no exact-match required, it uses ratio brackets.

## Installation

```bash
npm install
npm run build
npm link   # makes `wallpaper-organizer` available globally
```

Or run directly without building:

```bash
npx tsx src/index.ts <source> [output] [options]
```

## Usage

```
wallpaper-organizer <source> [output] [options]
```

| Argument | Description |
|---|---|
| `<source>` | Directory containing your wallpapers |
| `[output]` | Where to put organized folders (default: `<source>/organized`) |

## Options

| Flag | Description | Default |
|---|---|---|
| `-m, --mode <copy\|move>` | Copy or move files | `copy` |
| `-r, --recursive` | Recurse into sub-directories | off |
| `--dry-run` | Preview without writing anything | off |
| `--flat` | Only ratio folders, skip resolution sub-folders | off |
| `-c, --clean` | Human-friendly folder names | off |
| `-v, --verbose` | Log every file as it processes | off |
| `--list-categories` | Print all possible output folders and exit | — |

## Examples

```bash
# Preview (safe — no files written)
wallpaper-organizer ~/Pictures/Wallpapers --dry-run

# Copy into organized subfolders, recursing into subfolders
wallpaper-organizer ~/Pictures/Wallpapers --recursive

# Move files into clean-named folders
wallpaper-organizer ~/Downloads/walls ~/Wallpapers --mode move --clean

# Flat mode — only ratio folders, no resolution sub-folder
wallpaper-organizer ~/walls --flat --clean
```

## Folder Structure

### Technical names (default)

```
organized/
├── HD_16-9/
│   ├── 1080p/
│   ├── 1440p/
│   └── 4K/
├── UltraWide_21-9/
│   └── 1440p/
├── UltraWide_32-9/
│   └── 4K/
├── Wide_16-10/
├── Classic_4-3/
├── Square_1-1/
└── Portrait_9-16/
```

### Clean names (`--clean`)

```
organized/
├── HD/
│   ├── FHD/     (1080p)
│   ├── QHD/     (1440p)
│   └── 4K/
├── Ultrawide/
├── Superwide/
├── Wide/
├── Classic/
├── Square/
└── Portrait/
```

## Aspect Ratio Brackets

| Folder | Ratio range | Examples |
|---|---|---|
| `UltraWide_32-9` / `Superwide` | ≥ 3.2:1 | 7680×2160, 5120×1440 |
| `UltraWide_21-9` / `Ultrawide` | 2.1–3.2 | 3440×1440, 2560×1080 |
| `HD_16-9` / `HD` | 1.65–2.1 | 1920×1080, 2560×1440, 3840×2160 |
| `Wide_16-10` / `Wide` | 1.4–1.65 | 2560×1600, 1920×1200 |
| `Classic_4-3` / `Classic` | 1.1–1.4 | 1024×768, 1600×1200 |
| `Square_1-1` / `Square` | 0.9–1.1 | 1000×1000 |
| `Portrait_9-16` / `Portrait` | < 0.9 | 1080×1920 |

## Resolution Tiers

| Tech label | Clean label | Min resolution |
|---|---|---|
| `5K` | `5K+` | 5120 × 2160 |
| `4K` | `4K` | 3840 × 2160 |
| `1440p` | `QHD` | 2560 × 1440 |
| `1080p` | `FHD` | 1920 × 1080 |
| `720p` | `HD` | 1280 × 720 |
| `SD` | `SD` | < 720p |

## Supported Formats

`jpg`, `jpeg`, `png`, `webp`, `tiff`, `bmp`, `gif`, `avif`

## Development

```bash
npm test          # run unit tests (vitest)
npm run build     # compile TypeScript → dist/
```
