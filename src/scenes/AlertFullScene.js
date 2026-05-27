import Phaser from 'phaser';
import { W, H } from '../config.js';

export default class AlertFullScene extends Phaser.Scene {
  constructor() {
    super('AlertFull');
    this.lines = [];
    this.nextScene = '';
    this._enterKey = null;
    this._blinkTimer = 0;
    this._blinkObj = null;
  }

  init(data) {
    this.lines = data.lines || [];
    this.nextScene = data.next || '';
  }

  create() {
    // ── Full-screen background ─────────────────────────────────────
    const bg = this.add.graphics();
    bg.fillStyle(0x04081c, 0.95);
    bg.fillRect(0, 0, W, H);

    // ── Red border ─────────────────────────────────────────────────
    bg.lineStyle(3, 0xcc2222, 1);
    bg.strokeRect(10, 10, W - 20, H - 20);

    // ── Lines centered vertically ──────────────────────────────────
    const validLines = this.lines.filter(l => l !== '');
    const lineHeights = validLines.map((_, i) => (i === 0 ? 44 : 28));
    const totalTextH = lineHeights.reduce((s, h) => s + h, 0) + (validLines.length - 1) * 10;
    let curY = (H - totalTextH) / 2;

    this.lines.forEach((line, i) => {
      if (line === '') return; // spacer

      const isFirst = (i === 0);
      this.add.text(W / 2, curY, line, {
        fontFamily: 'Courier New',
        fontSize: isFirst ? '34px' : '19px',
        fontStyle: 'bold',
        color: isFirst ? '#ff3333' : '#ffcc44',
      }).setOrigin(0.5, 0);

      curY += (isFirst ? 44 : 28) + 10;
    });

    // ── Blinking continue prompt ───────────────────────────────────
    this._blinkObj = this.add.text(W / 2, H - 28, '[ENTER para continuar]', {
      fontFamily: 'Courier New',
      fontSize: '13px',
      color: '#aaaacc',
    }).setOrigin(0.5, 1);

    // ── Input ──────────────────────────────────────────────────────
    this._enterKey = this.input.keyboard.addKey('ENTER');
    this._blinkTimer = 0;
  }

  update() {
    this._blinkTimer++;
    if (this._blinkTimer % 30 === 0) {
      this._blinkObj.setVisible(!this._blinkObj.visible);
    }

    if (Phaser.Input.Keyboard.JustDown(this._enterKey)) {
      this.scene.start(this.nextScene);
    }
  }
}
