import Phaser from "phaser";
import { PackageEntity } from "../objects/PackageEntity";
import type { GameMode } from "../types";
import { createRandomPackage } from "./packageFactory";
import type { GameLayout } from "./gameLayout";
import { getSimulationSpawnDelay } from "./simulationTuning";

export const SINGLE_WALL_MAX_CONVEYOR_PACKAGES = 3;
export const SINGLE_WALL_SPAWN_DELAY_MS = 3500;
export const SIMULATION_MAX_CONVEYOR_PACKAGES = 10;

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
    private readonly layout: GameLayout,
    private readonly getCurrentWallNumber: () => number,
    private readonly canSpawnPackages: () => boolean,
    private readonly onConveyorCountChanged: (count: number) => void,
  ) {
    this.settings = getSpawnSettingsForMode(gameMode);
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

    const packageData = createRandomPackage(++this.packageSequence);
    const spawnPoint = this.getSpawnPosition(packageData.height);
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
      ? getSimulationSpawnDelay(this.getCurrentWallNumber())
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
    const candidates = [
      conveyorBounds.x + 48,
      conveyorBounds.centerX,
      conveyorBounds.right - 48,
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

  private getSpawnPosition(packageHeight: number) {
    const conveyorBounds = this.layout.conveyorBounds;

    return {
      x: Phaser.Math.Between(conveyorBounds.x + 58, conveyorBounds.right - 58),
      y: conveyorBounds.y - packageHeight / 2 - 10,
    };
  }
}

export function getSpawnSettingsForMode(gameMode: GameMode): SpawnSettings {
  if (gameMode === "simulation") {
    return {
      maxConveyorPackages: SIMULATION_MAX_CONVEYOR_PACKAGES,
    };
  }

  return {
    maxConveyorPackages: SINGLE_WALL_MAX_CONVEYOR_PACKAGES,
  };
}
