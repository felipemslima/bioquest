import Phaser from 'phaser';
import { W, H, SCENES } from '../config.js';

export default class WinScene extends Phaser.Scene {
  constructor() {
    super('Win');
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

    // ── "VITÓRIA!" ─────────────────────────────────────────────────
    this.add.text(W / 2, H / 2 - 60, 'VITÓRIA!', {
      fontFamily: 'Courier New',
      fontSize: '52px',
      fontStyle: 'bold',
      color: '#ffff44',
    }).setOrigin(0.5);

    // ── Subtitle lines ─────────────────────────────────────────────
    this.add.text(W / 2, H / 2 - 12, 'A bactéria infectou o pulmão!', {
      fontFamily: 'Courier New',
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#88ff88',
    }).setOrigin(0.5);

    this.add.text(W / 2, H / 2 + 22, 'Macrófago derrotado ✓  |  Missão cumprida!', {
      fontFamily: 'Courier New',
      fontSize: '14px',
      color: '#aaaaff',
    }).setOrigin(0.5);

    // ── Blinking retry prompt (hidden until timer > 120) ───────────
    this._blinkText = this.add.text(W / 2, H / 2 + 70, '[ENTER] para jogar novamente', {
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
