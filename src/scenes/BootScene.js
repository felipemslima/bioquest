import Phaser from 'phaser';
import { W, H } from '../config.js';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload() {
    // ── Loading bar ────────────────────────────────────────────────
    const barW = 320;
    const barH = 18;
    const barX = (W - barW) / 2;
    const barY = H / 2 - barH / 2;

    const bg = this.add.graphics();
    bg.fillStyle(0x111122, 1);
    bg.fillRect(barX - 2, barY - 2, barW + 4, barH + 4);

    const bar = this.add.graphics();

    const label = this.add.text(W / 2, barY - 18, 'Carregando...', {
      fontFamily: 'Courier New',
      fontSize: '13px',
      color: '#8899cc',
    }).setOrigin(0.5, 1);

    this.load.on('progress', (value) => {
      bar.clear();
      bar.fillStyle(0x3366ff, 1);
      bar.fillRect(barX, barY, barW * value, barH);
    });

    this.load.on('complete', () => {
      bar.clear();
      bar.fillStyle(0x44aaff, 1);
      bar.fillRect(barX, barY, barW, barH);
      label.setText('Pronto!');
    });

    // ── Images ─────────────────────────────────────────────────────
    this.load.image('player',    'player.png');
    this.load.image('boss',      'boss.png');
    this.load.image('enemy',     'enemy.png');
    this.load.image('sword',     'sword.png');
    this.load.image('atp',       'atp.png');
    this.load.image('brickwall', 'brickwall.png');
    this.load.image('flowerbed', 'flowerbed.png');
    this.load.image('cloud1',    'cloud1.png');
    this.load.image('cloud2',    'cloud2.png');
    this.load.image('tree',      'tree.png');
    this.load.image('pipe',      'pipe.png');
    this.load.image('lungs',     'lungs.png');
    this.load.image('lung_gray', 'lung_gray.png');
    this.load.image('capsule',   'capsule.png');
    this.load.image('stars',     'stars.png');

    // ── Tilemaps ───────────────────────────────────────────────────
    this.load.tilemapTiledJSON('phase1', 'tilemaps/phase1.json');
    this.load.tilemapTiledJSON('phase2', 'tilemaps/phase2.json');
  }

  create() {
    this.scene.start('Title');
  }
}
