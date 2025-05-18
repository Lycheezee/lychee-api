export function calculateBMI(weight: number, height: number): number {
  const heightMeters = height / 100;
  return +(weight / (heightMeters * heightMeters)).toFixed(2);
}
