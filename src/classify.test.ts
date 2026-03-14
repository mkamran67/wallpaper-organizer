/**
 * classify.test.ts
 * Unit tests for the classifyImage function using vitest.
 */

import { describe, it, expect } from "vitest";
import { classifyImage } from "./classify.js";

describe("classifyImage — ratio folder", () => {
  it("classifies 32:9 (7680×2160) as superwide", () => {
    expect(classifyImage(7680, 2160).ratioFolder).toBe("superwide");
  });

  it("classifies 21:9 (3440×1440) as ultrawide", () => {
    expect(classifyImage(3440, 1440).ratioFolder).toBe("ultrawide");
  });

  it("classifies 16:9 (1920×1080) as wide", () => {
    expect(classifyImage(1920, 1080).ratioFolder).toBe("wide");
  });

  it("classifies 16:10 (2560×1600) as standard", () => {
    expect(classifyImage(2560, 1600).ratioFolder).toBe("standard");
  });

  it("classifies 4:3 (1024×768) as classic", () => {
    expect(classifyImage(1024, 768).ratioFolder).toBe("classic");
  });

  it("classifies square (1000×1000) as square", () => {
    expect(classifyImage(1000, 1000).ratioFolder).toBe("square");
  });

  it("classifies portrait (1080×1920) as portrait", () => {
    expect(classifyImage(1080, 1920).ratioFolder).toBe("portrait");
  });
});

describe("classifyImage — resolution folder", () => {
  it("labels 7680×4320 as 5K+", () => {
    expect(classifyImage(7680, 4320).resFolder).toBe("5K+");
  });

  it("labels 3840×2160 as 4K", () => {
    expect(classifyImage(3840, 2160).resFolder).toBe("4K");
  });

  it("labels 2560×1440 as 1440p", () => {
    expect(classifyImage(2560, 1440).resFolder).toBe("1440p");
  });

  it("labels 1920×1080 as 1080p", () => {
    expect(classifyImage(1920, 1080).resFolder).toBe("1080p");
  });

  it("labels 1280×720 as 720p", () => {
    expect(classifyImage(1280, 720).resFolder).toBe("720p");
  });

  it("labels 800×600 as SD", () => {
    expect(classifyImage(800, 600).resFolder).toBe("SD");
  });
});

describe("classifyImage — edge cases", () => {
  it("throws for zero dimensions", () => {
    expect(() => classifyImage(0, 1080)).toThrow();
    expect(() => classifyImage(1920, 0)).toThrow();
  });
});
