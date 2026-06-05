import Phaser from "phaser";
import type { PackageBody } from "../objects/PackageEntity";
import type { TruckBounds } from "./gameLayout";

export interface AABB {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export const MAX_OVERLAP_AREA_RATIO = 0.08;
export const BOUNDS_TOLERANCE = 0.5;

export function getWallZone(truckBounds: TruckBounds) {
  return new Phaser.Geom.Rectangle(
    truckBounds.left,
    truckBounds.top,
    truckBounds.right - truckBounds.left,
    truckBounds.bottom - truckBounds.top,
  );
}

export function isInsideTruckZone(truckBounds: TruckBounds, x: number, y: number) {
  return (
    x >= truckBounds.left &&
    x <= truckBounds.right &&
    y >= truckBounds.top &&
    y <= truckBounds.bottom
  );
}

export function clampPackageCenterToTruckBounds(
  truckBounds: TruckBounds,
  packageBody: PackageBody,
  x: number,
  y: number,
) {
  const { width, height } = getRotatedPackageSize(packageBody);

  return {
    x: Phaser.Math.Clamp(x, truckBounds.left + width / 2, truckBounds.right - width / 2),
    y: Phaser.Math.Clamp(y, truckBounds.top + height / 2, truckBounds.bottom - height / 2),
  };
}

export const clampToTruckBounds = clampPackageCenterToTruckBounds;

export function getRotatedPackageSize(packageBody: PackageBody) {
  const { width, height } = packageBody.packageData;
  const angle = Phaser.Math.DegToRad(Phaser.Math.Wrap(packageBody.angle, 0, 360));
  const cosine = Math.abs(Math.cos(angle));
  const sine = Math.abs(Math.sin(angle));

  return {
    width: width * cosine + height * sine,
    height: width * sine + height * cosine,
  };
}

export function getPackageAABB(packageBody: PackageBody): AABB {
  const { width, height } = getRotatedPackageSize(packageBody);

  return {
    left: packageBody.x - width / 2,
    right: packageBody.x + width / 2,
    top: packageBody.y - height / 2,
    bottom: packageBody.y + height / 2,
  };
}

export function isFullyInsideTruckBounds(truckBounds: TruckBounds, packageBody: PackageBody) {
  const bounds = getPackageAABB(packageBody);

  return (
    bounds.left >= truckBounds.left - BOUNDS_TOLERANCE &&
    bounds.right <= truckBounds.right + BOUNDS_TOLERANCE &&
    bounds.top >= truckBounds.top - BOUNDS_TOLERANCE &&
    bounds.bottom <= truckBounds.bottom + BOUNDS_TOLERANCE
  );
}

export function getOverlapArea(a: AABB, b: AABB) {
  const overlapWidth = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
  const overlapHeight = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));

  return overlapWidth * overlapHeight;
}

export function getOverlapRatio(activePackage: PackageBody, placedPackage: PackageBody) {
  const activeBounds = getPackageAABB(activePackage);
  const activeArea =
    (activeBounds.right - activeBounds.left) * (activeBounds.bottom - activeBounds.top);

  if (activeArea <= 0) {
    return 0;
  }

  return getOverlapArea(activeBounds, getPackageAABB(placedPackage)) / activeArea;
}
