import Phaser from "phaser";
import { PackageEntity } from "../objects/PackageEntity";
import type { GameMode, ShiftDifficulty } from "../types";
import { createRandomPackage } from "./packageFactory";
import type { GameLayout } from "./gameLayout";
import { getShiftDifficultyConfig, getShiftSpawnDelay } from "./shiftDifficulty";

export const SINGLE_WALL_SPAWN_DELAY_MS = 3500;

interface SpawnSettings {
  maxConveyorPackages: number;
}

export class PackageSpawner {
  private packageSequence = 0;
  private spawnEvent?: Phaser.Time.TimerEvent;
  private readonly settings: SpawnSettings;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly packages: PackageEntity[],
    private readonly gameMode: GameMode,
    private readonly shiftDifficulty: ShiftDifficulty,
    private readonly layout: GameLayout,
    private readonly getCurrentWallNumber: () => number,
    private readonly canSpawnPackages: () => boolean,
    private readonly onConveyorCountChanged: (count: number) => void,
  ) {
    this.settings = getSpawnSettingsForDifficulty(shiftDifficulty);
  }

  start(spawnImmediately = true) {
    this.stop();
    if (spawnImmediately) {
      this.spawnPackage();
    }
    this.spawnEvent = this.scene.time.addEvent({
      delay: this.getCurrentSpawnDelay(),
      loop: true,
      callback: () => this.spawnPackage(),
    });
  }

  stop() {
    this.spawnEvent?.remove(false);
    this.spawnEvent = undefined;
  }

  pause() {
    if (this.spawnEvent) {
      this.spawnEvent.paused = true;
    }
  }

  resume() {
    if (this.spawnEvent) {
      this.spawnEvent.paused = false;
    }
  }

  reset() {
    this.stop();
    this.packageSequence = 0;
  }

  restartSpawnTimerForCurrentMode() {
    this.start(false);
  }

  spawnPackage() {
    if (
      !this.canSpawnPackages() ||
      this.getConveyorPackageCount() >= this.settings.maxConveyorPackages
    ) {
      return null;
    }

    const bulkChance = getShiftDifficultyConfig(this.shiftDifficulty).bulkChance;
    const packageData = createRandomPackage(++this.packageSequence, bulkChance);
    const spawnPoint = this.getSpawnPosition(packageData.width, packageData.height);
    const packageEntity = new PackageEntity(this.scene, spawnPoint.x, spawnPoint.y, packageData);

    this.scene.input.setDraggable(packageEntity.sprite);
    this.packages.push(packageEntity);
    this.onConveyorCountChanged(this.getConveyorPackageCount());

    return packageEntity;
  }

  getConveyorPackageCount() {
    return this.packages.filter((packageEntity) => !packageEntity.sprite.placedInWall).length;
  }

  getMaxConveyorPackages() {
    return this.settings.maxConveyorPackages;
  }

  getCurrentSpawnDelay() {
    return this.gameMode === "simulation"
      ? getShiftSpawnDelay(this.shiftDifficulty, this.getCurrentWallNumber())
      : SINGLE_WALL_SPAWN_DELAY_MS;
  }

  notifyConveyorCountChanged() {
    this.onConveyorCountChanged(this.getConveyorPackageCount());
  }

  getReturnPosition(packageEntity: PackageEntity) {
    const conveyorBounds = this.layout.conveyorBounds;
    const packageWidth = packageEntity.sprite.packageData.width;
    const packageHeight = packageEntity.sprite.packageData.height;
    const y = conveyorBounds.y - packageHeight / 2 - 10;
    const horizontalInset = packageWidth / 2 + 8;
    const leftPosition = conveyorBounds.x + horizontalInset;
    const rightPosition = conveyorBounds.right - horizontalInset;
    const candidates = [
      leftPosition <= rightPosition ? leftPosition : conveyorBounds.centerX,
      conveyorBounds.centerX,
      leftPosition <= rightPosition ? rightPosition : conveyorBounds.centerX,
    ];
    const otherConveyorPackages = this.packages.filter(
      (candidate) => candidate !== packageEntity && !candidate.sprite.placedInWall,
    );
    const openX = candidates.find((x) =>
      otherConveyorPackages.every((candidate) => {
        const requiredDistance = (packageWidth + candidate.sprite.packageData.width) / 2 + 8;
        return Math.abs(candidate.sprite.x - x) >= requiredDistance;
      }),
    );

    return {
      x: openX ?? conveyorBounds.centerX,
      y,
    };
  }

  private getSpawnPosition(packageWidth: number, packageHeight: number) {
    const conveyorBounds = this.layout.conveyorBounds;
    const horizontalInset = packageWidth / 2 + 8;
    const minX = conveyorBounds.x + horizontalInset;
    const maxX = conveyorBounds.right - horizontalInset;

    return {
      x: minX <= maxX ? Phaser.Math.Between(Math.ceil(minX), Math.floor(maxX)) : conveyorBounds.centerX,
      y: conveyorBounds.y - packageHeight / 2 - 10,
    };
  }
}

export function getSpawnSettingsForDifficulty(shiftDifficulty: ShiftDifficulty): SpawnSettings {
  return {
    maxConveyorPackages: getShiftDifficultyConfig(shiftDifficulty).conveyorLimit,
  };
}
