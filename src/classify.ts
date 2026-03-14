/**
 * classify.ts
 * Classifies an image into a single category folder.
 *
 * Default (by resolution): 4K | 1440p | 1080p | 720p | SD
 * With --by-ratio:         ultrawide | wide | standard | portrait | square
 */

export interface Classification {
  /** Folder name for resolution-based grouping */
  resFolder: string;
  /** Folder name for ratio-based grouping */
  ratioFolder: string;
}

// ---------------------------------------------------------------------------
// Resolution tiers — ordered highest first, first match wins.
// ---------------------------------------------------------------------------
interface ResTier {
  minWidth: number;
  minHeight: number;
  label: string;
}

const RES_TIERS: ResTier[] = [
  { minWidth: 5120, minHeight: 2160, label: "5K+"   },
  { minWidth: 3840, minHeight: 2160, label: "4K"    },
  { minWidth: 2560, minHeight: 1440, label: "1440p" },
  { minWidth: 1920, minHeight: 1080, label: "1080p" },
  { minWidth: 1280, minHeight:  720, label: "720p"  },
  { minWidth:    0, minHeight:    0, label: "SD"    },
];

// ---------------------------------------------------------------------------
// Aspect-ratio brackets — ordered widest first, first match wins.
// ---------------------------------------------------------------------------
interface RatioBracket {
  minRatio: number;
  maxRatio: number;
  label: string;
}

const RATIO_BRACKETS: RatioBracket[] = [
  { minRatio: 3.2,  maxRatio: Infinity, label: "superwide" },
  { minRatio: 2.1,  maxRatio: 3.2,     label: "ultrawide" },
  { minRatio: 1.65, maxRatio: 2.1,     label: "wide"      },
  { minRatio: 1.4,  maxRatio: 1.65,    label: "standard"  },
  { minRatio: 1.1,  maxRatio: 1.4,     label: "classic"   },
  { minRatio: 0.9,  maxRatio: 1.1,     label: "square"    },
  { minRatio: 0,    maxRatio: 0.9,     label: "portrait"  },
];

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Classify an image by its width × height.
 * Returns both a resolution folder and a ratio folder.
 */
export function classifyImage(width: number, height: number): Classification {
  if (width <= 0 || height <= 0) {
    throw new Error(`Invalid dimensions: ${width}×${height}`);
  }

  const ratio  = width / height;
  const maxDim = Math.max(width, height);
  const minDim = Math.min(width, height);

  // Resolution tier
  const tier = RES_TIERS.find(
    (t) => maxDim >= t.minWidth && minDim >= t.minHeight
  ) ?? RES_TIERS[RES_TIERS.length - 1];

  // Ratio bracket
  const bracket = RATIO_BRACKETS.find(
    (b) => ratio >= b.minRatio && ratio < b.maxRatio
  );
  if (!bracket) {
    throw new Error(`Could not classify ratio ${ratio.toFixed(3)} (${width}×${height})`);
  }

  return {
    resFolder:   tier.label,
    ratioFolder: bracket.label,
  };
}

/**
 * Return all possible category folder names for --list-categories.
 */
export function listCategories(byRatio: boolean): string[] {
  if (byRatio) {
    return RATIO_BRACKETS.map((b) => b.label);
  }
  return RES_TIERS.map((t) => t.label);
}
