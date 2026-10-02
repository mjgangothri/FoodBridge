import Phaser from "phaser";
import { calculateImpact } from "../utils/impactCalculator.js";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:4000";
const ROUND_SECONDS = 30;

export default class GameScene extends Phaser.Scene {
  constructor() { super("Game"); }

  create() {
    this.saved = 0;
    this.wasted = 0;
    this.timeLeft = ROUND_SECONDS;

    this.basket = this.physics.add.image(240, 670, "basket").setImmovable(true);
    this.basket.body.allowGravity = false;
    this.items = this.physics.add.group();

    this.hud = this.add.text(16, 12, "", {
      fontFamily: "Georgia, serif", fontSize: "20px", color: "#1d2b24",
    });

    this.input.on("pointermove", (p) => {
      this.basket.x = Phaser.Math.Clamp(p.x, 48, 432);
    });

    this.physics.add.overlap(this.basket, this.items, (_b, item) => {
      item.getData("spoiled") ? this.wasted++ : this.saved++;
      item.destroy();
    });

    this.time.addEvent({ delay: 550, loop: true, callback: () => this.spawn() });
    this.time.addEvent({
      delay: 1000, loop: true,
      callback: () => { if (--this.timeLeft <= 0) this.endRound(); },
    });
  }

  spawn() {
    const spoiled = Math.random() < 0.25;
    const item = this.items.create(Phaser.Math.Between(30, 450), -20, spoiled ? "spoiled" : "fresh");
    item.setData("spoiled", spoiled);
    item.setVelocityY(Phaser.Math.Between(140, 260));
  }

  update() {
    const { points } = calculateImpact(this.saved, this.wasted);
    this.hud.setText(`Time ${this.timeLeft}   Rescued ${this.saved}   Points ${points}`);
    this.items.getChildren().forEach((i) => {
      if (i.y > 740) { i.destroy(); }
    });
  }

  async endRound() {
    const { points, meals } = calculateImpact(this.saved, this.wasted);
    const name = (window.prompt("Round over! Enter a name for the leaderboard:", "Volunteer") || "Anonymous").slice(0, 30);

    let message = `${meals} pretend meals saved (just a game!)`;
    try {
      const res = await fetch(`${API}/api/scores`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerName: name, points, itemsSaved: this.saved, itemsWasted: this.wasted }),
      });
      if (!res.ok) throw new Error(res.statusText);
    } catch {
      message += " (score could not be sent; check your connection)";
    }

    this.add.rectangle(240, 360, 400, 220, 0xf3efe4).setStrokeStyle(3, 0x2f6f4f);
    this.add.text(240, 330, `${points} points\n${message}`, {
      fontFamily: "Georgia, serif", fontSize: "22px", color: "#1d2b24", align: "center", wordWrap: { width: 360 },
    }).setOrigin(0.5);
    this.add.text(240, 420, "Tap to play again", {
      fontFamily: "Georgia, serif", fontSize: "18px", color: "#2f6f4f",
    }).setOrigin(0.5);
    this.input.once("pointerdown", () => this.scene.restart());
    this.time.removeAllEvents();
    this.physics.pause();
  }
}
