import { describe, expect, it } from "vitest";
import {
  basisPointsToPercentage,
  paiseToRupees,
  percentageToBasisPoints,
  rupeesToPaise,
} from "./money";

describe("money conversion", () => {
  it("converts rupees with exact decimal paise", () => {
    expect(rupeesToPaise("125.50")).toBe(12550);
    expect(rupeesToPaise("10")).toBe(1000);
    expect(rupeesToPaise("0.05")).toBe(5);
  });

  it("rejects malformed or over-precise rupee values", () => {
    expect(rupeesToPaise("12.345")).toBeNull();
    expect(rupeesToPaise("-1")).toBeNull();
    expect(rupeesToPaise("₹10")).toBeNull();
  });

  it("converts percentages to backend basis points", () => {
    expect(percentageToBasisPoints("10")).toBe(1000);
    expect(percentageToBasisPoints("10.5")).toBe(1050);
    expect(basisPointsToPercentage(1000)).toBe("10");
  });

  it("formats backend paise for editing", () => {
    expect(paiseToRupees(12550)).toBe("125.50");
  });
});
