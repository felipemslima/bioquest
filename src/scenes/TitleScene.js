import Phaser from 'phaser';
import { W, H, SCENES } from '../config.js';

export default class TitleScene extends Phaser.Scene {
  constructor() {
    super('Title');
    this._blinkTimer = 0;
    this._blinkText = null;
  }

  create() {
    // ── Sky gradient ───────────────────────────────────────────────
    const sky = this.add.graphics();
    sky.fillGradientStyle(0x080f28, 0x080f28, 0x0f1e48, 0x0f1e48, 1);
    sky.fillRect(0, 0, W, H);

    // ── Stars ──────────────────────────────────────────────────────
    const starGfx = this.add.graphics();
    starGfx.fillStyle(0xffffff, 1);
    for (let i = 0; i < 60; i++) {
      const sx = Phaser.Math.Between(0, W);
      const sy = Phaser.Math.Between(0, H * 0.65);
      const sr = Phaser.Math.FloatBetween(0.5, 2);
      const alpha = Phaser.Math.FloatBetween(0.4, 1.0);
      this.add.circle(sx, sy, sr, 0xffffff, alpha);
    }

    // ── Mountains ─────────────────────────────────────────────────
    const mtns = this.add.graphics();
    mtns.fillStyle(0x141e30, 1);
    // Mountain 1
    mtns.fillTriangle(0, H, 180, 380, 380, H);
    // Mountain 2
    mtns.fillTriangle(320, H, 520, 350, 720, H);
    // Mountain 3
    mtns.fillTriangle(650, H, 820, 370, W, H);

    // ── Trees ─────────────────────────────────────────────────────
    if (this.textures.exists('tree')) {
      const t1 = this.add.image(60, H - 100, 'tree').setDepth(1);
      t1.setDisplaySize(80, 120);
      const t2 = this.add.image(W - 100, H - 100, 'tree').setDepth(1);
      t2.setDisplaySize(80, 120);
    }

    // ── Ground strip ───────────────────────────────────────────────
    this.add.rectangle(W / 2, H - 30, W, 60, 0x1e6030).setDepth(2);

    // ── Title "BIOQUEST" ──────────────────────────────────────────
    this.add.text(W / 2 + 3, 203, 'BIOQUEST', {
      fontFamily: 'Courier New',
      fontSize: '72px',
      fontStyle: 'bold',
      color: '#220011',
    }).setOrigin(0.5).setDepth(3);

    this.add.text(W / 2, 200, 'BIOQUEST', {
      fontFamily: 'Courier New',
      fontSize: '72px',
      fontStyle: 'bold',
      color: '#ff4488',
    }).setOrigin(0.5).setDepth(4);

    // ── Subtitle badge "FASE 3" ────────────────────────────────────
    const badgeBg = this.add.rectangle(W / 2, 262, 110, 28, 0x330011).setDepth(4);
    this.add.text(W / 2, 262, 'FASE 3', {
      fontFamily: 'Courier New',
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#660022',
    }).setOrigin(0.5).setDepth(5);

    // ── Blinking [NOVO JOGO] ───────────────────────────────────────
    this._blinkText = this.add.text(W / 2, 330, '[NOVO JOGO]', {
      fontFamily: 'Courier New',
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#ffffff',
    }).setOrigin(0.5).setDepth(5);

    // ── Footer ─────────────────────────────────────────────────────
    this.add.text(W / 2, 375, 'Pressione ENTER para começar', {
      fontFamily: 'Courier New',
      fontSize: '14px',
      color: '#7090cc',
    }).setOrigin(0.5).setDepth(5);

    // ── Input ──────────────────────────────────────────────────────
    this.input.keyboard.on('keydown-ENTER', () => {
      this.scene.start(SCENES.OBJECTIVES);
    });
    this.input.keyboard.on('keydown-SPACE', () => {
      this.scene.start(SCENES.OBJECTIVES);
    });

    this._blinkTimer = 0;
  }

  update() {
    this._blinkTimer++;
    if (this._blinkTimer % 30 === 0) {
      this._blinkText.setVisible(!this._blinkText.visible);
    }
  }
}
