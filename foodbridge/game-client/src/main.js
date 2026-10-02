import Phaser from "phaser";
import BootScene from "./scenes/BootScene.js";
import GameScene from "./scenes/GameScene.js";

new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game",
  width: 480,
  height: 720,
  backgroundColor: "#f3efe4",
  physics: { default: "arcade", arcade: { gravity: { y: 0 } } },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [BootScene, GameScene],
});
