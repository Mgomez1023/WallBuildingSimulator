import Phaser from "phaser";
import type { PackageData } from "../types";
import {
  CATEGORY_GHOST,
  CATEGORY_PACKAGE,
  PACKAGE_COLLISION_MASK,
} from "../systems/collisionCategories";

export interface PackageBody extends Phaser.Physics.Matter.Image {
  packageData: PackageData;
  placedInWall: boolean;
}

export class PackageEntity {
  readonly sprite: PackageBody;
  private readonly label: Phaser.GameObjects.Text;
  private defaultDepth = 10;
  private labelDepth = 20;
  private originalCollisionFilter?: MatterJS.ICollisionFilter;
  private isGhostDragging = false;

  constructor(scene: Phaser.Scene, x: number, y: number, data: PackageData) {
    const textureKey = ensurePackageTexture(scene, data);
    const sprite = scene.matter.add.image(x, y, textureKey) as PackageBody;

    sprite.packageData = data;
    sprite.placedInWall = false;
    sprite.setName(data.id);
    sprite.setRectangle(data.width, data.height);
    sprite.setMass(data.weight);
    sprite.setFriction(0.85);
    sprite.setFrictionStatic(1);
    sprite.setFrictionAir(0.01);
    sprite.setBounce(data.fragility === "high" ? 0.05 : 0.12);
    sprite.setCollisionCategory(CATEGORY_PACKAGE);
    sprite.setCollidesWith(PACKAGE_COLLISION_MASK);
    sprite.setInteractive({ useHandCursor: true });
    sprite.setDepth(this.defaultDepth);

    this.sprite = sprite;
    this.label = scene.add
      .text(x, y, data.label, {
        color: "#23170f",
        fontFamily: "Arial, sans-serif",
        fontSize: "14px",
        fontStyle: "700",
      })
      .setOrigin(0.5)
      .setDepth(this.labelDepth);
  }

  updateLabel() {
    this.label.setPosition(this.sprite.x, this.sprite.y);
    this.label.setRotation(0);
  }

  enterGhostDragMode() {
    const body = this.sprite.body as MatterJS.BodyType & { ignoreGravity?: boolean };
    this.originalCollisionFilter = { ...body.collisionFilter };
    this.isGhostDragging = true;
    body.ignoreGravity = true;
    this.sprite.setStatic(true);
    this.disablePackageCollision();
    this.sprite.setDepth(100);
    this.label.setDepth(110);
    this.sprite.setAlpha(0.6);
    this.label.setAlpha(0.75);
    this.sprite.setFrictionAir(1);
    this.stopMotion();
  }

  exitGhostDragMode() {
    const body = this.sprite.body as MatterJS.BodyType & { ignoreGravity?: boolean };
    body.ignoreGravity = false;
    this.isGhostDragging = false;
    this.restorePackageCollision();
    this.sprite.setStatic(false);
    this.sprite.setDepth(this.defaultDepth);
    this.label.setDepth(this.labelDepth);
    this.sprite.setAlpha(1);
    this.label.setAlpha(1);
    this.sprite.clearTint();
    this.label.clearTint();
    this.sprite.setFrictionAir(0.01);
    this.stopMotion();
  }

  updateGhostPlacementFeedback(isValid: boolean) {
    if (!this.isGhostDragging) {
      return;
    }

    const tint = isValid ? 0x74d68a : 0xff6b6b;
    this.sprite.setTint(tint);
    this.label.setTint(tint);
  }

  disablePackageCollision() {
    this.sprite.setCollisionCategory(CATEGORY_GHOST);
    this.sprite.setCollidesWith(0);
  }

  restorePackageCollision() {
    const body = this.sprite.body as MatterJS.BodyType;
    const filter = this.originalCollisionFilter;

    if (filter) {
      body.collisionFilter.category = filter.category;
      body.collisionFilter.mask = filter.mask;
      body.collisionFilter.group = filter.group;
      this.originalCollisionFilter = undefined;
      return;
    }

    this.sprite.setCollisionCategory(CATEGORY_PACKAGE);
    this.sprite.setCollidesWith(PACKAGE_COLLISION_MASK);
  }

  stopMotion() {
    this.sprite.setVelocity(0, 0);
    this.sprite.setAngularVelocity(0);
  }

  destroy() {
    this.label.destroy();
    this.sprite.destroy();
  }
}

function ensurePackageTexture(scene: Phaser.Scene, data: PackageData) {
  const textureKey = `package-${data.width}x${data.height}-${data.color}-${data.fragility}`;

  if (scene.textures.exists(textureKey)) {
    return textureKey;
  }

  const graphics = scene.add.graphics();
  const tapeColor = data.fragility === "high" ? 0xffd166 : 0xd9b36a;
  const borderColor = data.fragility === "high" ? 0xbf2f2f : 0x432918;

  graphics.fillStyle(data.color, 1);
  graphics.fillRoundedRect(0, 0, data.width, data.height, 6);
  graphics.fillStyle(tapeColor, 0.9);
  graphics.fillRect(data.width / 2 - 5, 0, 10, data.height);
  graphics.fillRect(0, data.height / 2 - 4, data.width, 8);
  graphics.lineStyle(data.fragility === "high" ? 4 : 2, borderColor, 1);
  graphics.strokeRoundedRect(1, 1, data.width - 2, data.height - 2, 6);
  graphics.generateTexture(textureKey, data.width, data.height);
  graphics.destroy();

  return textureKey;
}
