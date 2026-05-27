import Phaser from 'phaser';
import { W, H } from '../config.js';

export default class AlertOverScene extends Phaser.Scene {
  constructor() {
    super('AlertOver');
    this.lines = [];
    this._timer = 0;
    this.parentScene = '';
    this.doneEvent = 'alertOverDone';
  }

  init(data) {
    this.lines = data.lines || [];
    this._timer = data.timer !== undefined ? data.timer : 200;
    this.parentScene = data.parentScene || '';
    this.doneEvent = data.doneEvent || 'alertOverDone';
  }

  create() {
    // ── Bottom panel ───────────────────────────────────────────────
    const gfx = this.add.graphics();
    gfx.fillStyle(0x000000, 0.76);
    gfx.fillRect(0, H - 118, W, 118);

    // ── Red border ─────────────────────────────────────────────────
    gfx.lineStyle(2, 0xcc2222, 1);
    gfx.strokeRect(2, H - 118, W - 4, 116);

    // ── Lines (up to 4, filter empty) ─────────────────────────────
    const visibleLines = this.lines.filter(l => l !== '').slice(0, 4);
    let lineY = H - 100;

    visibleLines.forEach((line, i) => {
      this.add.text(W / 2, lineY, line, {
        fontFamily: 'Courier New',
        fontSize: i === 0 ? '20px' : '15px',
        fontStyle: 'bold',
        color: i === 0 ? '#ff4444' : '#ffdd44',
      }).setOrigin(0.5, 0);
      lineY += 28;
    });
  }

  update() {
    this._timer--;
    if (this._timer <= 0) {
      const parent = this.scene.get(this.parentScene);
      if (parent) {
        parent.events.emit(this.doneEvent);
      }
      this.scene.stop();
    }
  }
}
