export function round(num, decimals = 4) {
  if (typeof num !== "number") return 0;
  const factor = Math.pow(10, decimals);
  return Math.round(num * factor) / factor;
}