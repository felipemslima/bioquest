import Phaser from 'phaser';
import { W, H } from '../config.js';

const PAD_X = W * 0.06;
const PANEL_W = W * 0.88;
const PANEL_H = H * 0.86;
const PANEL_X = (W - PANEL_W) / 2;
const PANEL_Y = (H - PANEL_H) / 2;
const CONTENT_X = PANEL_X + 22;
const CONTENT_W = PANEL_W - 44;

export default class InfoScene extends Phaser.Scene {
  constructor() {
    super('Info');
    this.pages = [];
    this.nextScene = '';
    this.nextData = {};
    this.currentPage = 0;
    this._pageObjects = [];
    this._enterKey = null;
    this._blinkTimer = 0;
    this._blinkObj = null;
  }

  init(data) {
    this.pages = data.pages || [];
    this.nextScene = data.next || '';
    this.nextData = data.nextData || {};
    this.currentPage = 0;
  }

  create() {
    // ── Background ─────────────────────────────────────────────────
    const bg = this.add.graphics();
    bg.fillStyle(0x05091e, 1);
    bg.fillRect(0, 0, W, H);

    // ── Starfield ─────────────────────────────────────────────────
    for (let i = 0; i < 50; i++) {
      const sx = Phaser.Math.Between(0, W);
      const sy = Phaser.Math.Between(0, H * 0.55);
      const sr = Phaser.Math.FloatBetween(0.5, 1.5);
      const alpha = Phaser.Math.FloatBetween(0.3, 0.9);
      this.add.circle(sx, sy, sr, 0xffffff, alpha);
    }

    // ── Panel background ───────────────────────────────────────────
    this._panelGfx = this.add.graphics();
    this._drawPanel();

    // ── Enter key ─────────────────────────────────────────────────
    this._enterKey = this.input.keyboard.addKey('ENTER');
    this._blinkTimer = 0;

    // ── First page ────────────────────────────────────────────────
    this._pageObjects = [];
    this._renderPage();
  }

  _drawPanel() {
    const g = this._panelGfx;
    g.clear();
    // Panel fill
    g.fillStyle(0x050c26, 1);
    g.fillRoundedRect(PANEL_X, PANEL_Y, PANEL_W, PANEL_H, 10);
    // Panel stroke
    g.lineStyle(2, 0x1a3580, 1);
    g.strokeRoundedRect(PANEL_X, PANEL_Y, PANEL_W, PANEL_H, 10);
    // Title bar
    g.fillStyle(0x091840, 1);
    g.fillRoundedRect(PANEL_X, PANEL_Y, PANEL_W, 38, { tl: 10, tr: 10, bl: 0, br: 0 });
  }

  _clearPage() {
    this._pageObjects.forEach(obj => obj.destroy());
    this._pageObjects = [];
  }

  _renderPage() {
    this._clearPage();
    this._blinkTimer = 0;

    const page = this.pages[this.currentPage];
    if (!page) return;

    // ── Title bar text ─────────────────────────────────────────────
    const titleTxt = this.add.text(W / 2, PANEL_Y + 19, page.title || '', {
      fontFamily: 'Courier New',
      fontSize: '17px',
      fontStyle: 'bold',
      color: '#e0e8ff',
    }).setOrigin(0.5);
    this._pageObjects.push(titleTxt);

    // ── Content items ──────────────────────────────────────────────
    let curY = PANEL_Y + 52;
    const lineH = 22;
    const bodyWrap = CONTENT_W - 4;

    (page.items || []).forEach((item) => {
      if (item.h !== undefined && item.h !== null) {
        // Header
        const txt = this.add.text(CONTENT_X, curY, item.h, {
          fontFamily: 'Courier New',
          fontSize: '14px',
          fontStyle: 'bold',
          color: '#88aaff',
          wordWrap: { width: bodyWrap, useAdvancedWrap: true },
        });
        this._pageObjects.push(txt);
        curY += Math.max(txt.height, lineH) + 4;
      }

      if (item.b !== undefined && item.b !== null) {
        if (item.b === '') {
          curY += 8;
          return;
        }
        // Body — handle '\n' by splitting lines
        const lines = item.b.split('\n');
        lines.forEach((line) => {
          const txt = this.add.text(CONTENT_X + 6, curY, line, {
            fontFamily: 'Courier New',
            fontSize: '13px',
            color: '#a0b8e0',
            wordWrap: { width: bodyWrap - 6, useAdvancedWrap: true },
          });
          this._pageObjects.push(txt);
          curY += Math.max(txt.height, 18) + 2;
        });
        curY += 2;
      }
    });

    // ── Page counter (right-aligned) ───────────────────────────────
    const pageCounterStr = `${this.currentPage + 1} / ${this.pages.length}`;
    const counterTxt = this.add.text(PANEL_X + PANEL_W - 14, PANEL_Y + PANEL_H - 36, pageCounterStr, {
      fontFamily: 'Courier New',
      fontSize: '12px',
      color: '#556688',
    }).setOrigin(1, 0);
    this._pageObjects.push(counterTxt);

    // ── Blinking footer prompt ─────────────────────────────────────
    const isLastPage = this.currentPage === this.pages.length - 1;
    const promptStr = isLastPage ? '[ENTER — Começar]' : '[ENTER — Próximo]';
    this._blinkObj = this.add.text(W / 2, PANEL_Y + PANEL_H - 22, promptStr, {
      fontFamily: 'Courier New',
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#aaccff',
    }).setOrigin(0.5);
    this._pageObjects.push(this._blinkObj);
  }

  update() {
    // Blink footer
    this._blinkTimer++;
    if (this._blinkObj && this._blinkTimer % 30 === 0) {
      this._blinkObj.setVisible(!this._blinkObj.visible);
    }

    // Advance on ENTER
    if (Phaser.Input.Keyboard.JustDown(this._enterKey)) {
      if (this.currentPage < this.pages.length - 1) {
        this.currentPage++;
        this._renderPage();
      } else {
        this.scene.start(this.nextScene, this.nextData);
      }
    }
  }
}
