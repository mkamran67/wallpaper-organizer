# 🖼 Wallpaper Organizer

A fast CLI tool that scans a folder of wallpaper images and sorts them into subfolders based on **resolution** (default), **aspect ratio**, or **device type**.

No exact resolution matching is required — it groups images into logical tiers or brackets using the nearest standard sizes.

## 🚀 Installation

Requires Node.js 18 or newer, including npm.
From this checkout, run:

```bash
./install.sh
wo --help
```

The script installs locked dependencies, builds the CLI, and uses `npm link` to make `wo` available globally.
Run `./install.sh` again after updating the source to rebuild and update an existing global installation.
It can also be invoked by its full path from another directory.
The installer is tested on macOS.

If `wo` is not found after installation, add `$(npm prefix -g)/bin` to your shell's `PATH`.
The global command links to this checkout, so keep the project folder in place and run `npm run build` after changing the source.
To remove the global command, run:

```bash
./uninstall.sh
```

The uninstall script keeps the project folder and your images.
Both scripts use the active Node.js installation's npm global prefix.

Or run directly without installing:

```bash
npx tsx src/cli.ts <source> [output] [options]
```

## 🛠 Usage

The CLI command is simply `wo`:

```bash
wo <source> [output] [options]
```

| Argument   | Description                                                    |
| ---------- | -------------------------------------------------------------- |
| `<source>` | Directory containing your wallpapers                           |
| `[output]` | Where to put organized folders (default: `<source>/organized`) |

## ⚙️ Options

| Flag                      | Description                                                            | Default |
| ------------------------- | ---------------------------------------------------------------------- | ------- |
| `-m, --mode <copy\|move>` | Copy or move files                                                     | `copy`  |
| `-r, --recursive`         | Recurse into sub-directories to find images                            | off     |
| `--dry-run`               | Preview without writing anything                                       | off     |
| `--by-ratio`              | Group by aspect ratio instead of resolution (e.g. `wide`, `ultrawide`) | off     |
| `--by-device`             | Group into `desktop` (landscape or square) and `portrait` (mobile/portrait monitor) | off |
| `--count`                 | Count images in the source directory and exit (no organizing)          | off     |
| `-v, --verbose`           | Log every file as it processes                                         | off     |
| `--list-categories`       | Print all possible output folders and exit                             | -       |

Use either `--by-device` or `--by-ratio`; combining them is rejected.

## 💡 Examples

```bash
# Preview what would happen (no files written)
wo ~/Pictures/Wallpapers --dry-run

# Copy into organized subfolders, recursing into subfolders
wo ~/Pictures/Wallpapers --recursive

# Count all wallpapers recursively (fast analysis)
wo ~/Pictures/Wallpapers --recursive --count

# Group by aspect ratio instead of resolution
wo ~/Downloads/walls ~/Wallpapers --mode move --by-ratio

# Group for desktop monitors or portrait displays, including mobile
wo ~/Pictures/Wallpapers --recursive --by-device

# Preview device grouping without copying or moving anything
wo ~/Pictures/Wallpapers --recursive --by-device --dry-run --verbose
```

## 📂 Folder Structure

Images are placed directly into the category folders.

### By Resolution (Default)

Images are grouped by the closest resolution tier (based on the largest dimension):

```text
organized/
├── 5K+/
├── 4K/
├── 1440p/
├── 1080p/
├── 720p/
└── SD/
```

### By Aspect Ratio (`--by-ratio`)

Images are grouped by aspect ratio brackets (width / height):

```text
organized/
├── superwide/     (≥ 3.2:1)
├── ultrawide/     (2.1:1 - 3.2:1)
├── wide/          (1.65:1 - 2.1:1)
├── standard/      (1.4:1 - 1.65:1)
├── classic/       (1.1:1 - 1.4:1)
├── square/        (~ 1:1)
└── portrait/      (< 0.9:1)
```

### By Device Type (`--by-device`)

Device grouping uses image orientation, with square images included in `desktop`.
Any image taller than it is wide goes in `portrait`, including nearly square portrait images.

```text
organized/
├── desktop/      (width >= height: desktop monitors, including square images)
└── portrait/     (height > width: mobile or portrait monitors)
```

## 🖼 Supported Formats

The tool uses `sharp` under the hood and automatically detects sizes for:
`jpg`, `jpeg`, `png`, `webp`, `tiff`, `tif`, `bmp`, `gif`, `avif`

## 👨‍💻 Development

```bash
npm install       # Install dependencies
npm run dev       # Run using tsx
npm test          # Run unit tests (vitest)
npm run build     # Compile TypeScript → dist/
```
