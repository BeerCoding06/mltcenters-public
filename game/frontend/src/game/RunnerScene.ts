import Phaser from "phaser";
import { EventBus, GAME_EVENTS } from "./EventBus";

const GROUND_Y = 380;

export class RunnerScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Container;
  private groundTiles: Phaser.GameObjects.Rectangle[] = [];
  private obstacles: Phaser.GameObjects.Container[] = [];
  private clouds: Phaser.GameObjects.Ellipse[] = [];

  private scrollSpeed = 3;
  private paused = false;
  private obstacleTimer = 0;
  private obstacleInterval = 2800;
  private legFrame = 0;

  constructor() {
    super("RunnerScene");
  }

  create() {
    // Sky gradient layers
    this.add.rectangle(400, 225, 800, 450, 0x87ceeb);
    this.add.rectangle(400, 350, 800, 200, 0xb4e4ff, 0.4);

    // Clouds
    for (let i = 0; i < 5; i++) {
      const cloud = this.add.ellipse(
        Phaser.Math.Between(0, 800),
        Phaser.Math.Between(40, 120),
        Phaser.Math.Between(60, 100),
        40,
        0xffffff,
        0.85
      );
      this.clouds.push(cloud);
    }

    // Ground tiles
    for (let i = 0; i < 10; i++) {
      const tile = this.add.rectangle(i * 100, GROUND_Y + 20, 100, 40, 0x5d4037);
      this.groundTiles.push(tile);
    }
    this.add.rectangle(400, GROUND_Y + 45, 800, 90, 0x4e342e);

    // Player character (simple runner)
    this.player = this.add.container(120, GROUND_Y - 30);
    const body = this.add.rectangle(0, 0, 36, 48, 0xff6b35);
    body.setStrokeStyle(2, 0xffffff);
    const head = this.add.circle(0, -34, 14, 0xffcc80);
    head.setStrokeStyle(2, 0xffffff);
    const eye = this.add.circle(4, -36, 3, 0x222222);
    const legL = this.add.rectangle(-8, 28, 10, 22, 0xe64a19);
    legL.setName("legL");
    const legR = this.add.rectangle(8, 28, 10, 22, 0xe64a19);
    legR.setName("legR");
    const arm = this.add.rectangle(14, -8, 8, 24, 0xff6b35);
    arm.setName("arm");
    this.player.add([legL, legR, body, arm, head, eye]);

    this.physics.add.existing(this.player);
    const body_phys = this.player.body as Phaser.Physics.Arcade.Body;
    body_phys.setSize(36, 48);
    body_phys.setOffset(-18, -54);
    body_phys.setCollideWorldBounds(true);

    EventBus.on(GAME_EVENTS.UPDATE_STATS, this.onStatsUpdate.bind(this));
    EventBus.emit(GAME_EVENTS.READY);
  }

  onStatsUpdate(payload: unknown) {
    const stats = payload as { speed: number; hp: number; game_over: boolean };
    this.scrollSpeed = Math.max(2, stats.speed / 70);
    this.obstacleInterval = Math.max(1200, 3500 - stats.speed * 4);

    if (stats.game_over) {
      this.paused = true;
      EventBus.emit(GAME_EVENTS.GAME_OVER);
    }
  }

  setPaused(value: boolean) {
    this.paused = value;
  }

  update(_time: number, delta: number) {
    if (this.paused) return;

    // Scroll ground
    for (const tile of this.groundTiles) {
      tile.x -= this.scrollSpeed;
      if (tile.x < -50) tile.x += 1000;
    }

    // Move clouds
    for (const cloud of this.clouds) {
      cloud.x -= this.scrollSpeed * 0.3;
      if (cloud.x < -80) {
        cloud.x = 880;
        cloud.y = Phaser.Math.Between(40, 120);
      }
    }

    // Move obstacles
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      obs.x -= this.scrollSpeed * 1.2;
      if (obs.x < -40) {
        obs.destroy();
        this.obstacles.splice(i, 1);
      } else if (obs.x < 160 && obs.x > 80 && !obs.getData("hit")) {
        obs.setData("hit", true);
        this.paused = true;
        EventBus.emit(GAME_EVENTS.OBSTACLE_HIT);
      }
    }

    // Spawn obstacles
    this.obstacleTimer += delta;
    if (this.obstacleTimer >= this.obstacleInterval) {
      this.obstacleTimer = 0;
      this.spawnObstacle();
    }

    // Running animation
    this.legFrame += delta * 0.02 * (this.scrollSpeed / 3);
    const legL = this.player.getByName("legL") as Phaser.GameObjects.Rectangle;
    const legR = this.player.getByName("legR") as Phaser.GameObjects.Rectangle;
    const arm = this.player.getByName("arm") as Phaser.GameObjects.Rectangle;
    legL.rotation = Math.sin(this.legFrame) * 0.5;
    legR.rotation = Math.sin(this.legFrame + Math.PI) * 0.5;
    arm.rotation = Math.sin(this.legFrame) * 0.3;

    // Bobbing
    this.player.y = GROUND_Y - 30 + Math.sin(this.legFrame * 2) * 3;
  }

  private spawnObstacle() {
    const types = ["cactus", "rock", "barrier"];
    const type = types[Phaser.Math.Between(0, types.length - 1)];
    const container = this.add.container(850, GROUND_Y - 10);

    if (type === "cactus") {
      const base = this.add.rectangle(0, -20, 20, 40, 0x2e7d32);
      const arm1 = this.add.rectangle(-12, -30, 14, 8, 0x388e3c);
      const arm2 = this.add.rectangle(12, -25, 14, 8, 0x388e3c);
      container.add([base, arm1, arm2]);
    } else if (type === "rock") {
      const rock = this.add.circle(0, -15, 22, 0x757575);
      container.add(rock);
    } else {
      const barrier = this.add.rectangle(0, -25, 12, 50, 0xff5252);
      const top = this.add.rectangle(0, -52, 30, 8, 0xff5252);
      container.add([barrier, top]);
    }

    container.setData("hit", false);
    this.obstacles.push(container);
  }

  shutdown() {
    EventBus.off(GAME_EVENTS.UPDATE_STATS, this.onStatsUpdate.bind(this));
  }
}
