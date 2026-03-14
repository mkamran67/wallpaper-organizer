# 🖼 Wallpaper Organizer

A fast CLI tool that scans a folder of wallpaper images and sorts them into subfolders based on **resolution** (default) or **aspect ratio**.

No exact resolution matching is required — it groups images into logical tiers or brackets using the nearest standard sizes.

## 🚀 Installation

Install globally using npm:

```bash
# Since the package is not published yet, you can link it locally
git clone https://github.com/mkamran67/wallpaper-organizer.git
cd wallpaper-organizer
npm install
npm run build
npm link   # makes `wo` available globally
```

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
| `--count`                 | Count images in the source directory and exit (no organizing)          | off     |
| `-v, --verbose`           | Log every file as it processes                                         | off     |
| `--list-categories`       | Print all possible output folders and exit                             | —       |

## 💡 Examples

```bash
# Preview what would happen (safe — no files written)
wo ~/Pictures/Wallpapers --dry-run

# Copy into organized subfolders, recursing into subfolders
wo ~/Pictures/Wallpapers --recursive

# Count all wallpapers recursively (fast analysis)
wo ~/Pictures/Wallpapers --recursive --count

# Group by aspect ratio instead of resolution
wo ~/Downloads/walls ~/Wallpapers --mode move --by-ratio
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
