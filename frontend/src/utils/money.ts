export function rupeesToPaise(value: string): number | null {
  const normalized = value.trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) return null;
  const [whole, fraction = ""] = normalized.split(".");
  const paise = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return Number.isSafeInteger(paise) ? paise : null;
}

export function paiseToRupees(value: number): string {
  return (value / 100).toFixed(2);
}

export function percentageToBasisPoints(value: string): number | null {
  const normalized = value.trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) return null;
  const [whole, fraction = ""] = normalized.split(".");
  const basisPoints = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return Number.isSafeInteger(basisPoints) ? basisPoints : null;
}

export function basisPointsToPercentage(value: number): string {
  return (value / 100).toFixed(2).replace(/\.00$/, "");
}