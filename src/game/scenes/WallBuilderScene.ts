import Phaser from "phaser";
import { PackageEntity } from "../objects/PackageEntity";
import type { GameMode, GameStatus, PackageData } from "../types";
import { gameEvents } from "../systems/EventBus";
import { PackageSpawner } from "../systems/PackageSpawner";
import type { GameLayout } from "../systems/gameLayout";
import { WALL_COMPLETION_BONUS } from "../systems/simulationTuning";
import {
  clampToTruckBounds,
  getOverlapRatio,
  isFullyInsideTruckBounds,
  isInsideTruckZone,
  MAX_OVERLAP_AREA_RATIO,
} from "../systems/trailerBounds";

const PHONE_TOUCH_BREAKPOINT = 500;
const PHONE_TOUCH_DRAG_Y_OFFSET = 95;
const TABLET_TOUCH_DRAG_Y_OFFSET = 75;
const TRAILER_LABEL_GAP = 18;
const TRAILER_LABEL_DEPTH = 50;

export class WallBuilderScene extends Phaser.Scene {
  private packages: PackageEntity[] = [];
  private draggedPackage: PackageEntity | null = null;
  private dragOrigin: { x: number; y: number; angle: number } | null = null;
  private activeTouchDragYOffset = 0;
  private packageSpawner?: PackageSpawner;
  private conveyorBelt?: Phaser.GameObjects.TileSprite;
  private currentWallScore = 0;
  private totalRunScore = 0;
  private currentWallPackagesPlaced = 0;
  private totalPackagesPlaced = 0;
  private wallsCompleted = 0;
  private wallNumber = 1;
  private gameStatus: GameStatus = "instructions";
  private unsubscribePause?: () => void;
  private unsubscribeResume?: () => void;
  private unsubscribeGameOver?: () => void;
  private unsubscribeFinishWall?: () => void;
  private unsubscribeStartNewWall?: () => void;
  private unsubscribeSetStatus?: () => void;
  private unsubscribeRotateActive?: () => void;

  constructor(
    private readonly gameMode: GameMode,
    private readonly layout: GameLayout,
  ) {
    super("WallBuilderScene");
  }

  create() {
    this.drawSceneChrome();
    this.createPhysicsBoundaries();
    this.createInputHandlers();
    this.createUiEventHandlers();

    this.packageSpawner = new PackageSpawner(
      this,
      this.packages,
      this.gameMode,
      this.layout,
      () => this.wallNumber,
      () => this.canSpawnPackages(),
      (count) => this.handleConveyorCountChanged(count),
    );
    this.packageSpawner.start();
    this.setGameStatus("instructions");
  }

  update(_time: number, delta: number) {
    if (this.conveyorBelt && this.gameStatus === "running") {
      this.conveyorBelt.tilePositionX += delta * 0.09;
    }

    this.packages.forEach((packageEntity) => packageEntity.updateLabel());
  }

  private drawSceneChrome() {
    const { gameWidth, gameHeight, truckBounds, conveyorBounds, trailerWallThickness } =
      this.layout;

    this.cameras.main.setBackgroundColor("#f6f0e4");

    const graphics = this.add.graphics();
    graphics.fillStyle(0xefe2cb, 1);
    graphics.fillRect(0, 0, gameWidth, gameHeight);

    graphics.fillStyle(0x6b3f22, 0.12);
    graphics.fillRoundedRect(
      truckBounds.left,
      truckBounds.top,
      truckBounds.right - truckBounds.left,
      truckBounds.bottom - truckBounds.top,
      10,
    );
    graphics.lineStyle(4, 0x6b3f22, 0.78);
    graphics.strokeRoundedRect(
      truckBounds.left,
      truckBounds.top,
      truckBounds.right - truckBounds.left,
      truckBounds.bottom - truckBounds.top,
      10,
    );

    graphics.fillStyle(0x40291a, 1);
    graphics.fillRect(
      truckBounds.left,
      truckBounds.bottom,
      truckBounds.right - truckBounds.left,
      trailerWallThickness,
    );
    graphics.fillRect(
      truckBounds.left - trailerWallThickness,
      truckBounds.top - trailerWallThickness,
      trailerWallThickness,
      truckBounds.bottom - truckBounds.top + trailerWallThickness * 2,
    );
    graphics.fillRect(
      truckBounds.right,
      truckBounds.top - trailerWallThickness,
      trailerWallThickness,
      truckBounds.bottom - truckBounds.top + trailerWallThickness * 2,
    );
    graphics.fillRect(
      truckBounds.left,
      truckBounds.top - trailerWallThickness,
      truckBounds.right - truckBounds.left,
      trailerWallThickness,
    );

    graphics.fillStyle(0x2b2b2b, 1);
    graphics.fillRoundedRect(
      conveyorBounds.x,
      conveyorBounds.y,
      conveyorBounds.width,
      conveyorBounds.height,
      10,
    );
    graphics.fillStyle(0x151515, 1);
    graphics.fillRect(
      conveyorBounds.x + 12,
      conveyorBounds.bottom - 20,
      conveyorBounds.width - 24,
      12,
    );

    graphics.fillStyle(0x3b2b22, 1);
    graphics.fillRect(0, gameHeight - 26, gameWidth, 26);

    this.createConveyorTexture();
    this.conveyorBelt = this.add
      .tileSprite(
        conveyorBounds.centerX,
        conveyorBounds.centerY - 4,
        conveyorBounds.width - 30,
        44,
        "conveyor-stripe",
      )
      .setDepth(1);

    this.add
      .text(conveyorBounds.centerX, conveyorBounds.y - 26, "CONVEYOR", {
        color: "#4d321f",
        fontFamily: "Arial, sans-serif",
        fontSize: "14px",
        fontStyle: "800",
      })
      .setOrigin(0.5);

    this.add
      .text(
        (truckBounds.left + truckBounds.right) / 2,
        truckBounds.top - trailerWallThickness - TRAILER_LABEL_GAP,
        "TRUCK WALL ZONE",
        {
        color: "#4d321f",
        fontFamily: "Arial, sans-serif",
        fontSize: "15px",
        fontStyle: "800",
        },
      )
      .setOrigin(0.5)
      .setDepth(TRAILER_LABEL_DEPTH);
  }

  private createConveyorTexture() {
    if (this.textures.exists("conveyor-stripe")) {
      return;
    }

    const graphics = this.add.graphics();
    graphics.fillStyle(0x3f4447, 1);
    graphics.fillRect(0, 0, 48, 44);
    graphics.lineStyle(5, 0xf3c04d, 0.85);
    graphics.lineBetween(-8, 44, 18, 0);
    graphics.lineBetween(16, 44, 42, 0);
    graphics.lineBetween(40, 44, 66, 0);
    graphics.generateTexture("conveyor-stripe", 48, 44);
    graphics.destroy();
  }

  private createPhysicsBoundaries() {
    const { gameWidth, gameHeight, truckBounds, conveyorBounds, trailerWallThickness } =
      this.layout;

    this.matter.world.setBounds(0, 0, gameWidth, gameHeight, 28, true, true, false, true);

    // Static Matter bodies define the trailer as a real bounded space.
    // Packages can be dragged inside, then physics takes over after release.
    this.matter.add.rectangle(
      (truckBounds.left + truckBounds.right) / 2,
      truckBounds.bottom + trailerWallThickness / 2,
      truckBounds.right - truckBounds.left + trailerWallThickness * 2,
      trailerWallThickness,
      { isStatic: true },
    );
    this.matter.add.rectangle(
      truckBounds.left - trailerWallThickness / 2,
      (truckBounds.top + truckBounds.bottom) / 2,
      trailerWallThickness,
      truckBounds.bottom - truckBounds.top + trailerWallThickness * 2,
      { isStatic: true },
    );
    this.matter.add.rectangle(
      truckBounds.right + trailerWallThickness / 2,
      (truckBounds.top + truckBounds.bottom) / 2,
      trailerWallThickness,
      truckBounds.bottom - truckBounds.top + trailerWallThickness * 2,
      { isStatic: true },
    );
    this.matter.add.rectangle(
      (truckBounds.left + truckBounds.right) / 2,
      truckBounds.top - trailerWallThickness / 2,
      truckBounds.right - truckBounds.left + trailerWallThickness * 2,
      trailerWallThickness,
      { isStatic: true },
    );
    this.matter.add.rectangle(
      conveyorBounds.centerX,
      conveyorBounds.bottom - 12,
      conveyorBounds.width - 16,
      22,
      { isStatic: true },
    );
  }

  private createInputHandlers() {
    this.input.on(
      "dragstart",
      (pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.GameObject) => {
        const packageEntity = this.findPackageForGameObject(gameObject);
        if (!packageEntity || this.gameStatus !== "running") {
          return;
        }

        this.draggedPackage = packageEntity;
        this.dragOrigin = {
          x: packageEntity.sprite.x,
          y: packageEntity.sprite.y,
          angle: packageEntity.sprite.angle,
        };
        this.activeTouchDragYOffset = this.getTouchDragYOffset(pointer);
        this.enterGhostDragMode(packageEntity);
        gameEvents.emit("game:drag-active", true);
        this.moveDraggedPackage(pointer.x, pointer.y - this.activeTouchDragYOffset);
      },
    );

    this.input.on(
      "drag",
      (
        pointer: Phaser.Input.Pointer,
        gameObject: Phaser.GameObjects.GameObject,
        dragX: number,
        dragY: number,
      ) => {
        const packageEntity = this.findPackageForGameObject(gameObject);
        if (!packageEntity || packageEntity !== this.draggedPackage || this.gameStatus !== "running") {
          return;
        }

        this.moveDraggedPackage(
          this.activeTouchDragYOffset > 0 ? pointer.x : dragX,
          this.activeTouchDragYOffset > 0 ? pointer.y - this.activeTouchDragYOffset : dragY,
        );
      },
    );

    this.input.on(
      "dragend",
      (pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.GameObject) => {
        const packageEntity = this.findPackageForGameObject(gameObject);
        if (!packageEntity || packageEntity !== this.draggedPackage) {
          return;
        }

        if (this.activeTouchDragYOffset > 0 && this.gameStatus === "running") {
          this.moveDraggedPackage(pointer.x, pointer.y - this.activeTouchDragYOffset);
        }
        this.releaseDraggedPackage(packageEntity);
        this.draggedPackage = null;
        this.dragOrigin = null;
        this.activeTouchDragYOffset = 0;
        gameEvents.emit("game:drag-active", false);
      },
    );

    this.input.keyboard?.on("keydown", (event: KeyboardEvent) => {
      if (
        event.code === "Space" &&
        this.gameMode === "simulation" &&
        this.gameStatus === "running"
      ) {
        event.preventDefault();
        this.completeSimulationWall();
        return;
      }

      this.handleRotationInput(event);
    });
  }

  private createUiEventHandlers() {
    this.unsubscribeSetStatus = gameEvents.on("ui:set-status", (status) => this.setGameStatus(status));
    this.unsubscribePause = gameEvents.on("ui:pause", () => this.setGameStatus("paused"));
    this.unsubscribeResume = gameEvents.on("ui:resume", () => this.setGameStatus("running"));
    this.unsubscribeGameOver = gameEvents.on("ui:game-over", () => this.setGameStatus("gameOver"));
    this.unsubscribeFinishWall = gameEvents.on("ui:finish-wall", () => this.finishWall());
    this.unsubscribeStartNewWall = gameEvents.on("ui:start-new-wall", () => this.startNewWall());
    this.unsubscribeRotateActive = gameEvents.on("ui:rotate-active", (direction) => {
      if (this.gameStatus === "running") {
        this.rotateDraggedPackage(direction * 90);
      }
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.removeUiEventHandlers());
    this.events.once(Phaser.Scenes.Events.DESTROY, () => this.removeUiEventHandlers());
  }

  private removeUiEventHandlers() {
    this.packageSpawner?.stop();
    this.unsubscribePause?.();
    this.unsubscribeResume?.();
    this.unsubscribeGameOver?.();
    this.unsubscribeFinishWall?.();
    this.unsubscribeStartNewWall?.();
    this.unsubscribeSetStatus?.();
    this.unsubscribeRotateActive?.();
    this.unsubscribePause = undefined;
    this.unsubscribeResume = undefined;
    this.unsubscribeGameOver = undefined;
    this.unsubscribeFinishWall = undefined;
    this.unsubscribeStartNewWall = undefined;
    this.unsubscribeSetStatus = undefined;
    this.unsubscribeRotateActive = undefined;
  }

  private markPackagePlaced(packageEntity: PackageEntity) {
    if (packageEntity.sprite.placedInWall) {
      return;
    }

    const { x, y } = packageEntity.sprite;
    if (!isFullyInsideTruckBounds(this.layout.truckBounds, packageEntity.sprite)) {
      return;
    }

    const packageData = packageEntity.sprite.packageData;
    packageEntity.sprite.placedInWall = true;
    this.currentWallPackagesPlaced += 1;
    this.totalPackagesPlaced += 1;

    // Score is intentionally simple for the MVP, but it already considers
    // package footprint and stored depth so later scoring can evolve in place.
    const packageScore =
      10 +
      Math.round((packageData.width * packageData.height) / 900) +
      Math.round(packageData.depth / 5);
    this.currentWallScore += packageScore;
    this.totalRunScore += packageScore;
    this.packageSpawner?.notifyConveyorCountChanged();
    this.emitScoreUpdate(packageData);
  }

  private moveDraggedPackage(x: number, y: number) {
    if (!this.draggedPackage) {
      return;
    }

    const shouldClampToTrailer =
      this.draggedPackage.sprite.placedInWall ||
      isInsideTruckZone(
        this.layout.truckBounds,
        this.draggedPackage.sprite.x,
        this.draggedPackage.sprite.y,
      ) ||
      isInsideTruckZone(this.layout.truckBounds, x, y);
    const nextPosition = shouldClampToTrailer
      ? clampToTruckBounds(this.layout.truckBounds, this.draggedPackage.sprite, x, y)
      : {
          x: Phaser.Math.Clamp(x, 0, this.layout.gameWidth),
          y: Phaser.Math.Clamp(y, 0, this.layout.gameHeight),
        };

    this.draggedPackage.sprite.setPosition(nextPosition.x, nextPosition.y);
    this.draggedPackage.stopMotion();
    this.updateGhostPlacementFeedback(this.draggedPackage);
  }

  private getTouchDragYOffset(pointer: Phaser.Input.Pointer) {
    const pointerEvent = pointer.event as (Event & { pointerType?: string }) | undefined;
    const isTouch = pointer.wasTouch || pointerEvent?.pointerType === "touch";

    if (!isTouch) {
      return 0;
    }

    const screenOffset =
      window.innerWidth < PHONE_TOUCH_BREAKPOINT
        ? PHONE_TOUCH_DRAG_Y_OFFSET
        : TABLET_TOUCH_DRAG_Y_OFFSET;

    // Pointer coordinates are in game-space, so account for Phaser's FIT scaling
    // to keep the visible lift close to the requested screen-pixel distance.
    return screenOffset * this.scale.displayScale.y;
  }

  private releaseDraggedPackage(packageEntity: PackageEntity) {
    if (this.isValidPlacement(packageEntity)) {
      this.placePackage(packageEntity);
      return;
    }

    if (packageEntity.sprite.placedInWall) {
      if (this.dragOrigin) {
        packageEntity.sprite.setAngle(this.dragOrigin.angle);
        packageEntity.sprite.setPosition(this.dragOrigin.x, this.dragOrigin.y);
      }
      this.exitGhostDragMode(packageEntity);
    } else {
      this.returnPackageToConveyor(packageEntity);
    }
  }

  private enterGhostDragMode(packageEntity: PackageEntity) {
    packageEntity.enterGhostDragMode();
    this.updateGhostPlacementFeedback(packageEntity);
  }

  private exitGhostDragMode(packageEntity: PackageEntity) {
    packageEntity.exitGhostDragMode();
  }

  private isValidPlacement(packageEntity: PackageEntity) {
    return (
      isFullyInsideTruckBounds(this.layout.truckBounds, packageEntity.sprite) &&
      !this.hasInvalidOverlap(packageEntity)
    );
  }

  private hasInvalidOverlap(packageEntity: PackageEntity) {
    return this.packages.some(
      (placedPackage) =>
        placedPackage !== packageEntity &&
        placedPackage.sprite.placedInWall &&
        getOverlapRatio(packageEntity.sprite, placedPackage.sprite) > MAX_OVERLAP_AREA_RATIO,
    );
  }

  private updateGhostPlacementFeedback(packageEntity: PackageEntity) {
    packageEntity.updateGhostPlacementFeedback(this.isValidPlacement(packageEntity));
  }

  private placePackage(packageEntity: PackageEntity) {
    const clampedPosition = clampToTruckBounds(
      this.layout.truckBounds,
      packageEntity.sprite,
      packageEntity.sprite.x,
      packageEntity.sprite.y,
    );

    packageEntity.sprite.setPosition(clampedPosition.x, clampedPosition.y);
    this.exitGhostDragMode(packageEntity);
    this.markPackagePlaced(packageEntity);
  }

  private returnPackageToConveyor(packageEntity: PackageEntity) {
    packageEntity.sprite.setAngle(0);
    const returnPosition = this.packageSpawner?.getReturnPosition(packageEntity);

    if (returnPosition) {
      packageEntity.sprite.setPosition(returnPosition.x, returnPosition.y);
    }

    this.exitGhostDragMode(packageEntity);
  }

  private handleRotationInput(event: KeyboardEvent) {
    const rotationDirection = getRotationDirection(event.key);

    if (!rotationDirection || !this.draggedPackage || this.gameStatus !== "running") {
      return;
    }

    event.preventDefault();
    this.rotateDraggedPackage(rotationDirection * 90);
  }

  private rotateDraggedPackage(deltaDegrees: number) {
    if (!this.draggedPackage) {
      return;
    }

    this.draggedPackage.sprite.setAngle(
      snapToRightAngle(this.draggedPackage.sprite.angle + deltaDegrees),
    );
    this.draggedPackage.stopMotion();
    this.moveDraggedPackage(this.draggedPackage.sprite.x, this.draggedPackage.sprite.y);
  }

  private findPackageForGameObject(gameObject: Phaser.GameObjects.GameObject) {
    return this.packages.find((packageEntity) => packageEntity.sprite === gameObject) ?? null;
  }

  private finishWall() {
    if (this.gameMode === "simulation") {
      this.completeSimulationWall();
      return;
    }

    this.setGameStatus("wallFinished");
  }

  private startNewWall() {
    this.clearPackages();
    this.currentWallScore = 0;
    this.totalRunScore = 0;
    this.currentWallPackagesPlaced = 0;
    this.totalPackagesPlaced = 0;
    this.wallsCompleted += 1;
    this.wallNumber += 1;
    this.draggedPackage = null;
    this.dragOrigin = null;
    gameEvents.emit("game:drag-active", false);
    this.packageSpawner?.reset();
    this.setGameStatus("running");
    this.packageSpawner?.start();
    this.emitScoreUpdate();
  }

  private setGameStatus(status: GameStatus) {
    const previousStatus = this.gameStatus;
    this.gameStatus = status;

    if (status === "running") {
      this.matter.world.resume();
      this.packageSpawner?.resume();
      if (previousStatus === "instructions") {
        this.packageSpawner?.spawnPackage();
      }
      return;
    }

    if (this.draggedPackage && (status === "wallFinished" || status === "gameOver" || status === "menu")) {
      this.releaseDraggedPackage(this.draggedPackage);
      this.draggedPackage = null;
      this.dragOrigin = null;
      gameEvents.emit("game:drag-active", false);
    } else {
      this.draggedPackage?.stopMotion();
    }

    this.packageSpawner?.pause();

    if (status === "wallFinished" || status === "gameOver") {
      this.packageSpawner?.stop();
    }

    if (
      status === "instructions" ||
      status === "paused" ||
      status === "wallFinished" ||
      status === "gameOver" ||
      status === "menu"
    ) {
      this.matter.world.pause();
    }
  }

  private canSpawnPackages() {
    return this.gameStatus === "running";
  }

  private completeSimulationWall() {
    if (this.gameMode !== "simulation" || this.gameStatus !== "running") {
      return;
    }

    if (this.draggedPackage) {
      this.releaseDraggedPackage(this.draggedPackage);
      this.draggedPackage = null;
      this.dragOrigin = null;
      gameEvents.emit("game:drag-active", false);
    }

    if (this.currentWallPackagesPlaced <= 0) {
      return;
    }

    this.applyWallCompletionBonus();
    this.clearTrailerPackagesOnly();
    this.currentWallScore = 0;
    this.currentWallPackagesPlaced = 0;
    this.wallsCompleted += 1;
    this.wallNumber += 1;
    this.packageSpawner?.restartSpawnTimerForCurrentMode();
    this.packageSpawner?.notifyConveyorCountChanged();
    this.emitScoreUpdate();
  }

  private applyWallCompletionBonus() {
    this.totalRunScore += WALL_COMPLETION_BONUS;
  }

  private clearTrailerPackagesOnly() {
    const conveyorPackages = this.packages.filter((packageEntity) => {
      if (!packageEntity.sprite.placedInWall) {
        return true;
      }

      packageEntity.destroy();
      return false;
    });

    this.packages.length = 0;
    this.packages.push(...conveyorPackages);
  }

  private handleConveyorCountChanged(count: number) {
    this.emitScoreUpdate();

    if (
      this.gameMode === "simulation" &&
      this.gameStatus === "running" &&
      count >= (this.packageSpawner?.getMaxConveyorPackages() ?? Number.POSITIVE_INFINITY)
    ) {
      this.setGameStatus("gameOver");
      gameEvents.emit("game:simulation-over");
    }
  }

  private emitScoreUpdate(lastPackage?: PackageData) {
    gameEvents.emit("score:changed", {
      score: this.totalRunScore,
      currentWallScore: this.currentWallScore,
      placedPackages: this.currentWallPackagesPlaced,
      totalPackagesPlaced: this.totalPackagesPlaced,
      conveyorPackages: this.packageSpawner?.getConveyorPackageCount() ?? 0,
      wallsCompleted: this.wallsCompleted,
      wallNumber: this.wallNumber,
      spawnDelayMs: this.packageSpawner?.getCurrentSpawnDelay() ?? 0,
      lastPackage,
    });
  }

  private clearPackages() {
    this.packages.forEach((packageEntity) => packageEntity.destroy());
    this.packages.length = 0;
  }
}

function getRotationDirection(key: string) {
  const normalizedKey = key.toLowerCase();

  if (
    normalizedKey === "arrowleft" ||
    normalizedKey === "a" ||
    normalizedKey === "arrowdown" ||
    normalizedKey === "s"
  ) {
    return -1;
  }

  if (
    normalizedKey === "arrowright" ||
    normalizedKey === "d" ||
    normalizedKey === "arrowup" ||
    normalizedKey === "w"
  ) {
    return 1;
  }

  return 0;
}

function snapToRightAngle(angle: number) {
  return Phaser.Math.Wrap(Math.round(angle / 90) * 90, 0, 360);
}
