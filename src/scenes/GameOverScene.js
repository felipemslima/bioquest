import Phaser from 'phaser';
import { W, H, SCENES } from '../config.js';

export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOver');
    this._timer = 0;
    this._blinkText = null;
    this._blinkTimer = 0;
    this._enterKey = null;
    this._canExit = false;
  }

  create() {
    this._timer = 0;
    this._canExit = false;
    this._blinkTimer = 0;

    // ── Dark overlay ───────────────────────────────────────────────
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.85);

    // ── "GAME OVER" ───────────────────────────────────────────────
    this.add.text(W / 2, H / 2 - 60, 'GAME OVER', {
      fontFamily: 'Courier New',
      fontSize: '52px',
      fontStyle: 'bold',
      color: '#ff4444',
    }).setOrigin(0.5);

    // ── Subtitle ───────────────────────────────────────────────────
    this.add.text(W / 2, H / 2 - 8, 'A bactéria foi eliminada...', {
      fontFamily: 'Courier New',
      fontSize: '18px',
      color: '#cc8888',
    }).setOrigin(0.5);

    // ── Blinking retry prompt (hidden until timer > 120) ───────────
    this._blinkText = this.add.text(W / 2, H / 2 + 60, '[ENTER] para tentar novamente', {
      fontFamily: 'Courier New',
      fontSize: '16px',
      color: '#ffffff',
    }).setOrigin(0.5).setVisible(false);

    // ── Input ──────────────────────────────────────────────────────
    this._enterKey = this.input.keyboard.addKey('ENTER');
  }

  update() {
    this._timer++;

    if (this._timer > 120 && !this._canExit) {
      this._canExit = true;
      this._blinkText.setVisible(true);
    }

    if (this._canExit) {
      this._blinkTimer++;
      if (this._blinkTimer % 30 === 0) {
        this._blinkText.setVisible(!this._blinkText.visible);
      }

      if (Phaser.Input.Keyboard.JustDown(this._enterKey)) {
        this.scene.start(SCENES.TITLE);
      }
    }
  }
}
