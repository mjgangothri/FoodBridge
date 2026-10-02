import Phaser from "phaser";

// Draws every sprite with primitives, so the project needs no art assets.
export default class BootScene extends Phaser.Scene {
  constructor() { super("Boot"); }

  create() {
    const g = this.add.graphics();

    g.fillStyle(0x2f6f4f).fillRoundedRect(0, 0, 96, 40, 8);
    g.generateTexture("basket", 96, 40);
    g.clear();

    g.fillStyle(0xe8892b).fillCircle(20, 20, 20);
    g.generateTexture("fresh", 40, 40);
    g.clear();

    g.fillStyle(0x6b5b3e).fillCircle(20, 20, 20);
    g.fillStyle(0x3b6b2a).fillCircle(14, 14, 5).fillCircle(26, 24, 4);
    g.generateTexture("spoiled", 40, 40);
    g.destroy();

    this.add.text(240, 340, "FoodBridge\nRescue Run", {
      fontFamily: "Georgia, serif", fontSize: "40px", color: "#1d2b24", align: "center",
    }).setOrigin(0.5);
    this.add.text(240, 440, "A side game while you wait for pickups. Tap to start", {
      fontFamily: "Georgia, serif", fontSize: "20px", color: "#2f6f4f",
    }).setOrigin(0.5);

    this.input.once("pointerdown", () => this.scene.start("Game"));
  }
}
