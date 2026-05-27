import Phaser from 'phaser';
import { W, H, SCENES } from '../config.js';
import { INFO_P1 } from '../data/infoP1.js';

export default class ObjectivesScene extends Phaser.Scene {
  constructor() {
    super('Objectives');
    this._blinkTimer = 0;
    this._blinkText = null;
  }

  create() {
    // ── Sky gradient ───────────────────────────────────────────────
    const sky = this.add.graphics();
    sky.fillGradientStyle(0x080f28, 0x080f28, 0x0f1e48, 0x0f1e48, 1);
    sky.fillRect(0, 0, W, H);

    // ── Stars ──────────────────────────────────────────────────────
    for (let i = 0; i < 60; i++) {
      const sx = Phaser.Math.Between(0, W);
      const sy = Phaser.Math.Between(0, H * 0.65);
      const sr = Phaser.Math.FloatBetween(0.5, 2);
      const alpha = Phaser.Math.FloatBetween(0.4, 1.0);
      this.add.circle(sx, sy, sr, 0xffffff, alpha);
    }

    // ── Header ─────────────────────────────────────────────────────
    this.add.text(W / 2, 55, '[COMPLETE ESSA JORNADA PARA VENCER:]', {
      fontFamily: 'Courier New',
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#e0e0ff',
    }).setOrigin(0.5);

    // ── Cards ─────────────────────────────────────────────────────
    const cardW = 200;
    const cardH = 210;
    const gap = 30;
    const totalW = cardW * 3 + gap * 2;
    const startX = (W - totalW) / 2;
    const cardY = 200; // vertical center of cards

    const cards = [
      {
        labels: ['FASE 1', 'SOBREVIVA', 'À CHUVA ÁCIDA'],
        icon: 'enemy',
        fallbackColor: 0x44aa44,
      },
      {
        labels: ['FASE 2', 'ENCONTRE', 'O PULMÃO'],
        icon: 'lungs',
        fallbackColor: 0xcc4466,
      },
      {
        labels: ['FASE 2', 'VENÇA O', 'SISTEMA IMUNE'],
        icon: 'boss',
        fallbackColor: 0x4466cc,
      },
    ];

    cards.forEach((card, i) => {
      const cx = startX + i * (cardW + gap) + cardW / 2;
      const cy = cardY;

      // Card background
      const gfx = this.add.graphics();
      gfx.fillStyle(0x0a1240, 0.92);
      gfx.fillRoundedRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH, 12);
      gfx.lineStyle(2, 0x2244aa, 1);
      gfx.strokeRoundedRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH, 12);

      // Icon
      const iconY = cy - 30;
      if (this.textures.exists(card.icon)) {
        const img = this.add.image(cx, iconY, card.icon);
        img.setDisplaySize(64, 64);
      } else {
        // Fallback: two ellipses
        const fb = this.add.graphics();
        fb.fillStyle(card.fallbackColor, 1);
        fb.fillEllipse(cx - 14, iconY, 28, 38);
        fb.fillEllipse(cx + 14, iconY, 28, 38);
      }

      // Labels
      const labelStartY = cy + 40;
      card.labels.forEach((line, li) => {
        this.add.text(cx, labelStartY + li * 20, line, {
          fontFamily: 'Courier New',
          fontSize: li === 0 ? '13px' : '12px',
          fontStyle: li === 0 ? 'bold' : 'normal',
          color: li === 0 ? '#88aaff' : '#ccddff',
        }).setOrigin(0.5);
      });
    });

    // ── Blinking prompt ────────────────────────────────────────────
    this._blinkText = this.add.text(W / 2, H - 38, 'Pressione ENTER para começar', {
      fontFamily: 'Courier New',
      fontSize: '14px',
      color: '#ffffff',
    }).setOrigin(0.5);

    // ── Input ──────────────────────────────────────────────────────
    this.input.keyboard.on('keydown-ENTER', () => {
      this.scene.start(SCENES.INFO, { pages: INFO_P1, next: SCENES.PHASE1 });
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
