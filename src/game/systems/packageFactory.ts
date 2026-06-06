import type {
  BulkPackagePreset,
  BulkPackageShape,
  Fragility,
  PackageData,
} from "../types";

const COLORS = [0x8a4f27, 0xa56735, 0xc27a3b, 0x6f4a2f, 0xb88a44, 0x915f36];
const FRAGILITY_VALUES: Fragility[] = ["low", "medium", "high"];
const BULK_COLORS = [0x6b3f22, 0x7b5535, 0x80552d, 0x5d4636];
const BULK_MIN_WIDTH = 78;
const BULK_MAX_WIDTH = 190;
const BULK_MIN_HEIGHT = 64;
const BULK_MAX_HEIGHT = 126;
const BULK_MAX_ASPECT_RATIO = 2.25;

interface BulkPresetDefinition {
  id: BulkPackagePreset;
  width: number;
  height: number;
  depth: number;
  minWeight: number;
  maxWeight: number;
  fragility: Fragility;
  shape: BulkPackageShape;
  selectionWeight: number;
}

// Bulk packages deliberately use awkward rectangular footprints. They remain
// simple Matter rectangles so all existing drag, bounds, and collision logic applies.
export const BULK_PACKAGE_PRESETS: BulkPresetDefinition[] = [
  {
    id: "long",
    width: 180,
    height: 82,
    depth: 52,
    minWeight: 42,
    maxWeight: 68,
    fragility: "medium",
    shape: "wideOddBox",
    selectionWeight: 3,
  },
  {
    id: "wide",
    width: 176,
    height: 86,
    depth: 64,
    minWeight: 55,
    maxWeight: 82,
    fragility: "low",
    shape: "wideOddBox",
    selectionWeight: 3,
  },
  {
    id: "tall",
    width: 88,
    height: 122,
    depth: 58,
    minWeight: 48,
    maxWeight: 76,
    fragility: "high",
    shape: "slantedBox",
    selectionWeight: 3,
  },
  {
    id: "heavy-irregular",
    width: 146,
    height: 100,
    depth: 76,
    minWeight: 72,
    maxWeight: 110,
    fragility: "low",
    shape: "lumpyBox",
    selectionWeight: 4,
  },
  {
    id: "round",
    width: 116,
    height: 116,
    depth: 70,
    minWeight: 62,
    maxWeight: 94,
    fragility: "medium",
    shape: "round",
    selectionWeight: 1,
  },
];

const randomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const randomChoice = <T>(values: T[]) =>
  values[Math.floor(Math.random() * values.length)];

// Package data is generated independently from Phaser so future scoring,
// sorting, or conveyor rules can be tested without booting the game scene.
export function createRandomPackage(sequence: number, bulkChance = 0): PackageData {
  if (bulkChance > 0 && Math.random() < bulkChance) {
    return createBulkPackage(sequence);
  }

  const width = randomInt(46, 148);
  const height = randomInt(34, 108);
  const depth = randomInt(10, 58);
  const density = Math.random() * 0.7 + 0.65;
  const weight = Math.max(1, Math.round((width * height * density) / 950));
  const fragility = randomChoice(FRAGILITY_VALUES);

  return {
    id: `package-${sequence}`,
    kind: "standard",
    width,
    height,
    depth,
    weight,
    fragility,
    color: randomChoice(COLORS),
    label: `${weight} lb`,
  };
}

function createBulkPackage(sequence: number): PackageData {
  const preset = weightedRandomChoice(BULK_PACKAGE_PRESETS);
  const { width, height } = getSafeBulkDimensions(preset.width, preset.height);
  const weight = randomInt(preset.minWeight, preset.maxWeight);

  return {
    id: `package-${sequence}`,
    kind: "bulk",
    bulkPreset: preset.id,
    bulkShape: preset.shape,
    width,
    height,
    depth: preset.depth,
    weight,
    fragility: preset.fragility,
    color: randomChoice(BULK_COLORS),
    label: width < 105 ? `${weight} lb` : `BULK ${weight} lb`,
  };
}

function weightedRandomChoice(values: BulkPresetDefinition[]) {
  const totalWeight = values.reduce((sum, value) => sum + value.selectionWeight, 0);
  let roll = Math.random() * totalWeight;

  for (const value of values) {
    roll -= value.selectionWeight;
    if (roll <= 0) {
      return value;
    }
  }

  return values[values.length - 1];
}

function getSafeBulkDimensions(width: number, height: number) {
  let safeWidth = Math.min(BULK_MAX_WIDTH, Math.max(BULK_MIN_WIDTH, width));
  let safeHeight = Math.min(BULK_MAX_HEIGHT, Math.max(BULK_MIN_HEIGHT, height));

  if (safeWidth / safeHeight > BULK_MAX_ASPECT_RATIO) {
    safeWidth = safeHeight * BULK_MAX_ASPECT_RATIO;
  }

  if (safeHeight / safeWidth > BULK_MAX_ASPECT_RATIO) {
    safeHeight = safeWidth * BULK_MAX_ASPECT_RATIO;
  }

  return {
    width: Math.round(safeWidth),
    height: Math.round(safeHeight),
  };
}
