import type { Fragility, PackageData } from "../types";

const COLORS = [0x8a4f27, 0xa56735, 0xc27a3b, 0x6f4a2f, 0xb88a44, 0x915f36];
const FRAGILITY_VALUES: Fragility[] = ["low", "medium", "high"];

const randomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const randomChoice = <T>(values: T[]) =>
  values[Math.floor(Math.random() * values.length)];

// Package data is generated independently from Phaser so future scoring,
// sorting, or conveyor rules can be tested without booting the game scene.
export function createRandomPackage(sequence: number): PackageData {
  const width = randomInt(46, 148);
  const height = randomInt(34, 108);
  const depth = randomInt(10, 58);
  const density = Math.random() * 0.7 + 0.65;
  const weight = Math.max(1, Math.round((width * height * density) / 950));
  const fragility = randomChoice(FRAGILITY_VALUES);

  return {
    id: `package-${sequence}`,
    width,
    height,
    depth,
    weight,
    fragility,
    color: randomChoice(COLORS),
    label: `${weight} lb`,
  };
}
