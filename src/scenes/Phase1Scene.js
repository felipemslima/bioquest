import Phaser from 'phaser';
import { W, H, GY, P1W, SCENES } from '../config.js';
import { INFO_P2 } from '../data/infoP2.js';
import Player from '../entities/Player.js';

// ── Seeded RNG for deterministic decorations ──────────────────────
function mkRng(s) { return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
const rng = mkRng(42);
const STARS  = Array.from({ length: 120 }, () => ({
  x: rng() * W, y: 10 + rng() * 280, r: 0.6 + rng() * 1.2, ph: rng() * Math.PI * 2,
}));

export default class Phase1Scene extends Phaser.Scene {
  constructor() { super(SCENES.PHASE1); }

  // ─────────────────────────────────────────────────────────────────
  create() {
    this.worldW = P1W;

    // ── world bounds ──
    this.physics.world.setBounds(0, -200, P1W, H + 400);

    // ── Background (fixed to camera) ─────────────────────────────
    this._buildBg();

    // ── Platforms from tilemap ───────────────────────────────────
    this.platforms = this._buildPlatforms('phase1');

    // ── Exit pipe ────────────────────────────────────────────────
    const map    = this.make.tilemap({ key: 'phase1' });
    const sLayer = map.getObjectLayer('spawns');
    const spawns = sLayer ? sLayer.objects : [];
    this.exitPipe = spawns.find(o => o.name === 'exit_pipe') ||
      { x: 1900, y: 490, width: 50, height: 90 };

    // Exit pipe visual
    this._drawExitPipe(this.exitPipe.x, this.exitPipe.y);

    // ── ATP pickups ──────────────────────────────────────────────
    this.atpGroup = this.physics.add.staticGroup();
    const atpLayer = map.getObjectLayer('atp');
    const atpObjs  = atpLayer ? atpLayer.objects : [];
    atpObjs.forEach(o => {
      const img = this.atpGroup.create(o.x + o.width / 2, o.y + o.height / 2, 'atp');
      img.setDisplaySize(28, 28).refreshBody();
    });

    // ── Player ───────────────────────────────────────────────────
    const start = spawns.find(o => o.name === 'player_start');
    this.player = new Player(this, start.x, start.y);
    const cursors = this.input.keyboard.createCursorKeys();
    const keyAtk  = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);
    const keyAlt  = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    const keyA    = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    const keyD    = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    const keyW    = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.player.setKeys(cursors, keyAtk, { left: keyA, right: keyD, up: keyW });
    // also allow shift attack
    this._shiftKey = keyAlt;

    // ── Rain ─────────────────────────────────────────────────────
    this.rain = Array.from({ length: 10 }, () => ({
      x: 80 + Math.random() * (P1W - 160),
      y: -30 - Math.random() * 400,
      spd: 180 + Math.random() * 120,
    }));
    this._rainGfx = this.add.graphics().setDepth(6);

    // ── Physics colliders ────────────────────────────────────────
    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.overlap(this.player, this.atpGroup, this._collectAtp, null, this);

    // ── Camera ───────────────────────────────────────────────────
    this.cameras.main.setBounds(0, 0, P1W, H);
    this.cameras.main.startFollow(this.player, true, 0.12, 1);
    this.cameras.main.fadeIn(300, 0, 0, 0);

    // ── HUD ──────────────────────────────────────────────────────
    this._buildHUD();

    // ── Rain warning ─────────────────────────────────────────────
    this._rainWarnGfx = this.add.graphics().setDepth(20).setScrollFactor(0);
    this._rainTimer   = 300; // 5 seconds
    this._rainWarn    = true;
    this._warnTick    = 0;

    // ── Pipe entry lock ──────────────────────────────────────────
    this._transitioning = false;

    // ── WASD support ─────────────────────────────────────────────
    this.time.delayedCall(340, () => {
      this.scene.launch(SCENES.ALERT_OVER, {
        lines: [
          'ANTIMICROBIANOS',
          '',
          'AGENTES BACTERICIDAS MATAM BACTÉRIAS;',
          'OS BACTERIOSTÁTICOS FREIAM SUA REPRODUÇÃO.',
        ],
        timer: 260,
        parentScene: SCENES.PHASE1,
        doneEvent: 'phase1EduDone',
      });
    });
  }

  // ─────────────────────────────────────────────────────────────────
  update(time, delta) {
    if (this._transitioning) return;

    this.player.update();
    // Shift also triggers attack
    if (Phaser.Input.Keyboard.JustDown(this._shiftKey)) this.player.atkTimer = 16;

    this._updateRain(delta);
    this._checkRainHit();
    this._checkPipeEntry();
    this._updateRainWarn();
    this._updateHUD();

    // Respawn if fallen off world
    if (this.player.y > H + 150) {
      this.player.takeDamage(1);
      this.player.setPosition(
        Math.max(30, this.cameras.main.scrollX + 80),
        GY - 60
      );
      this.player.setVelocity(0, 0);
    }

    if (this.player.dead) this._gameOver();
  }

  // ─────────────────────────────────────────────────────────────────
  // Private helpers
  // ─────────────────────────────────────────────────────────────────

  _buildBg() {
    // Sky gradient
    const sky = this.add.graphics().setScrollFactor(0).setDepth(0);
    sky.fillGradientStyle(0x080f28, 0x080f28, 0x162b52, 0x162b52, 1);
    sky.fillRect(0, 0, W, H);

    // Stars
    const starGfx = this.add.graphics().setScrollFactor(0).setDepth(1);
    STARS.forEach(s => {
      starGfx.fillStyle(0xffffff, 0.6);
      starGfx.fillCircle(s.x, s.y, s.r);
    });

    // Moon
    const moon = this.add.graphics().setScrollFactor(0.05).setDepth(1);
    moon.fillStyle(0x8090a8); moon.fillCircle(700, 80, 56);
    moon.fillStyle(0x6a7a8a);
    [[-14, 10, 8], [16, -16, 6], [22, 18, 5]].forEach(([ox, oy, r]) =>
      moon.fillCircle(700 + ox, 80 + oy, r));

    // Mountains (parallax)
    const mtn = this.add.graphics().setScrollFactor(0.2).setDepth(2);
    mtn.fillStyle(0x1e2d40);
    [[0, H, 200, 370, 400, H],[350, H, 560, 350, 760, H],
     [700, H, 900, 360, 1100, H],[1100, H, 1350, 340, 1600, H],
     [1600, H, 1850, 360, 2100, H]].forEach(([x1,y1,x2,y2,x3,y3]) =>
       mtn.fillTriangle(x1, y1, x2, y2, x3, y3));

    // Ground visual
    const gnd = this.add.graphics().setDepth(3);
    gnd.fillStyle(0x2a1a0a); gnd.fillRect(0, GY + 40, P1W, H - GY);

    // Clouds (use images if loaded, else placeholders)
    const cloudY = [60, 80, 50, 70, 65, 55];
    for (let i = 0; i < 6; i++) {
      const cx = i * (P1W / 6) + 80;
      const key = i % 2 === 0 ? 'cloud1' : 'cloud2';
      try {
        const cl = this.add.image(cx, cloudY[i], key).setDepth(2).setScrollFactor(0.35);
        cl.setDisplaySize(140, 75).setAlpha(0.85);
      } catch (e) { /* skip if missing */ }
    }

    // Trees
    const treeX = [80, 480, 980, 1480, 1900];
    treeX.forEach(tx => {
      try {
        this.add.image(tx, GY - 55, 'tree').setDepth(4).setDisplaySize(80, 110);
      } catch (e) { /* skip */ }
    });

    // Decorative red pipes
    [230, 1100].forEach(px => {
      try {
        this.add.image(px, GY - 45, 'pipe').setDepth(4).setDisplaySize(44, 90);
      } catch (e) {
        const g = this.add.graphics().setDepth(4);
        g.fillStyle(0xcc2222); g.fillRect(px - 18, GY - 80, 36, 80);
      }
    });

    // Ground flowerbed strip
    try {
      const fb = this.add.tileSprite(P1W / 2, GY + 14, P1W, 20, 'flowerbed').setDepth(4);
    } catch (e) {
      const fb = this.add.graphics().setDepth(4);
      fb.fillStyle(0x2a8040); fb.fillRect(0, GY + 5, P1W, 14);
    }
  }

  _buildPlatforms(mapKey) {
    const map    = this.make.tilemap({ key: mapKey });
    const pLayer = map.getObjectLayer('platforms');
    const layer  = pLayer || { objects: [] };
    const group  = this.physics.add.staticGroup();

    layer.objects.forEach(obj => {
      const cx = obj.x + obj.width  / 2;
      const cy = obj.y + obj.height / 2;

      if (obj.type === 'ground') {
        // Solid ground — draw as rectangle
        const gfx = this.add.graphics().setDepth(5);
        gfx.fillStyle(0x5a4a3a); gfx.fillRect(obj.x, obj.y, obj.width, obj.height);
        gfx.fillStyle(0x3a2a1a); gfx.fillRect(obj.x, obj.y + 10, obj.width, obj.height - 10);
      } else {
        // Elevated platform — brick texture tile
        try {
          const ts = this.add.tileSprite(cx, cy, obj.width, obj.height, 'brickwall').setDepth(5);
        } catch (e) {
          const g = this.add.graphics().setDepth(5);
          g.fillStyle(0x8a8a9a); g.fillRect(obj.x, obj.y, obj.width, obj.height);
        }
        // Flower trim on top
        try {
          const fl = this.add.tileSprite(cx, obj.y - 7, obj.width, 16, 'flowerbed').setDepth(6);
        } catch (e) {}
      }

      // Physics body (invisible)
      const body = group.create(cx, cy, '__DEFAULT');
      body.setDisplaySize(obj.width, obj.height).setVisible(false).refreshBody();
    });

    return group;
  }

  _drawExitPipe(px, py) {
    const g = this.add.graphics().setDepth(7);
    // Glow (will be animated in update via tween instead)
    g.fillStyle(0x994400); g.fillRect(px - 20, py - 90, 40, 90);
    g.fillStyle(0xff8800); g.fillRect(px - 22, py - 96, 44, 14);
    g.fillStyle(0xffaa33); g.fillRect(px - 14, py - 82, 6, 78);
    this.add.text(px, py - 110, 'SAÍDA', {
      fontSize: '12px', fontFamily: '"Courier New"', color: '#ffff44',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(8);

    // Pulsing glow via tween
    const glow = this.add.graphics().setDepth(6);
    const glowTarget = { v: 0 };
    this.tweens.add({
      targets: glowTarget,
      v: Math.PI * 2,
      duration: 1200,
      repeat: -1,
      onUpdate: () => {
        glow.clear();
        const a = 0.18 + 0.12 * Math.sin(glowTarget.v);
        glow.fillStyle(0xffaa00, a);
        glow.fillCircle(px, py - 80, 50);
      },
    });

    // Blinking arrow
    this._pipeArrowText = this.add.text(px, py - 126, '↓', {
      fontSize: '20px', color: '#ffff00',
    }).setOrigin(0.5).setDepth(8);
    this.tweens.add({
      targets: this._pipeArrowText,
      alpha: 0,
      duration: 400,
      yoyo: true,
      repeat: -1,
    });
  }

  _updateRain(delta) {
    this._rainGfx.clear();
    const dt = delta / 1000;
    this.rain.forEach(d => {
      d.y += d.spd * dt;
      if (d.y > GY + 20) {
        d.x = 80 + Math.random() * (P1W - 160);
        d.y = -30 - Math.random() * 400;
      }
      // Draw acid rain drop
      this._rainGfx.fillStyle(0x44ff55, 0.9);
      this._rainGfx.fillEllipse(d.x, d.y, 10, 18);
      this._rainGfx.fillStyle(0xaaffcc, 0.7);
      this._rainGfx.fillEllipse(d.x - 2, d.y - 7, 4, 6);
    });
  }

  _checkRainHit() {
    const hurt = this.player.getHurtRect();
    this.rain.forEach(d => {
      const dropRect = new Phaser.Geom.Rectangle(d.x - 5, d.y - 9, 10, 18);
      if (Phaser.Geom.Intersects.RectangleToRectangle(hurt, dropRect)) {
        this.player.takeDamage(1);
      }
    });
  }

  _collectAtp(player, atp) {
    atp.destroy();
    const healed = player.hp < player.maxHp;
    if (healed) player.heal(1);
    const label = healed ? '+♥ Energia!' : 'Energia!';
    const color  = healed ? '#ff88aa'    : '#ffcc44';
    const txt = this.add.text(atp.x, atp.y - 10, label, {
      fontSize: '13px', fontFamily: '"Courier New"', color,
      fontStyle: 'bold',
    }).setDepth(15).setOrigin(0.5);
    this.tweens.add({
      targets: txt, y: txt.y - 50, alpha: 0,
      duration: 900, ease: 'Power2',
      onComplete: () => txt.destroy(),
    });
    this._burst(atp.x, atp.y, 0xffaa00, 8);
  }

  _checkPipeEntry() {
    if (this._transitioning) return;
    const p  = this.player;
    const ep = this.exitPipe;
    if (p.x + 20 > ep.x && p.x < ep.x + ep.width &&
        p.y + p.height > ep.y - 10) {
      this._transitioning = true;
      this.cameras.main.fadeOut(350, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start(SCENES.INFO, {
          pages:    INFO_P2,
          next:     SCENES.ALERT_FULL,
          nextData: {
            lines: [
              'ATENÇÃO!', '',
              'VOCÊ PRECISA INFECTAR ESSA CÉLULA,',
              'MAS... NÃO PARECE FÁCIL DEMAIS?',
            ],
            next: SCENES.PHASE2,
          },
        });
      });
    }
  }

  _updateRainWarn() {
    this._rainWarnGfx.clear();
    if (!this._rainWarn) return;
    this._warnTick++;
    if (this._rainTimer > 0) this._rainTimer--;
    else { this._rainWarn = false; return; }
    // blink: 40 on / 40 off
    if (this._warnTick % 80 < 40) return;
    this._rainWarnGfx.fillStyle(0x000000, 0.72);
    this._rainWarnGfx.fillRect(0, H - 116, W, 116);
    this._rainWarnGfx.lineStyle(2, 0xff4444, 1);
    this._rainWarnGfx.strokeRect(2, H - 116, W - 4, 114);
    if (!this._warnTexts) {
      this._warnTexts = [
        this.add.text(W / 2, H - 84, 'ATENÇÃO!', {
          fontSize: '22px', fontFamily: '"Courier New"',
          color: '#ff3333', fontStyle: 'bold',
        }).setOrigin(0.5).setScrollFactor(0).setDepth(21),
        this.add.text(W / 2, H - 58, 'CHUVA COM ALTO RISCO DE MORTE!!', {
          fontSize: '16px', fontFamily: '"Courier New"', color: '#ffcc00', fontStyle: 'bold',
        }).setOrigin(0.5).setScrollFactor(0).setDepth(21),
        this.add.text(W / 2, H - 30, 'FUJA PELO CANO INDICADO!! ➜', {
          fontSize: '16px', fontFamily: '"Courier New"', color: '#ffcc00', fontStyle: 'bold',
        }).setOrigin(0.5).setScrollFactor(0).setDepth(21),
      ];
    }
    const vis = this._warnTick % 80 >= 40;
    this._warnTexts.forEach(t => t.setVisible(vis));
  }

  _buildHUD() {
    // Hearts container
    this._hudBg = this.add.graphics().setScrollFactor(0).setDepth(25);
    this._hearts = [];
    for (let i = 0; i < 5; i++) {
      const h = this.add.graphics().setScrollFactor(0).setDepth(26);
      this._hearts.push(h);
    }
    // Phase label
    this._phaseLabel = this.add.text(W - 14, 30, '☔ FASE 1 — Chuva Ácida', {
      fontSize: '11px', fontFamily: '"Courier New"', color: '#8090cc', fontStyle: 'bold',
    }).setOrigin(1, 0.5).setScrollFactor(0).setDepth(26);
    // Controls hint
    this._controlHint = this.add.text(W / 2, H - 10,
      '← →/A D Mover   ↑/W/Espaço Pular   X/Shift Atacar', {
        fontSize: '11px', fontFamily: '"Courier New"', color: 'rgba(255,255,255,0.4)',
      }).setOrigin(0.5, 1).setScrollFactor(0).setDepth(26);
    this._controlTimer = 500;
  }

  _updateHUD() {
    this._hudBg.clear();
    this._hudBg.fillStyle(0x500078, 0.6);
    this._hudBg.fillRoundedRect(12, 12, 182, 40, 10);
    this._hudBg.lineStyle(2, 0xcc88ff, 1);
    this._hudBg.strokeRoundedRect(12, 12, 182, 40, 10);

    for (let i = 0; i < this.player.maxHp; i++) {
      const h = this._hearts[i];
      h.clear();
      this._drawHeart(h, 22 + i * 32, 32, i < this.player.hp);
    }

    if (this._controlTimer > 0) { this._controlTimer--; }
    else this._controlHint.setVisible(false);
  }

  _drawHeart(gfx, x, y, on) {
    const s = 13;
    gfx.fillStyle(on ? 0xff4466 : 0x442233);
    gfx.fillTriangle(x - s * 0.5, y, x, y + s * 0.9, x + s * 0.5, y);
    gfx.fillCircle(x - s * 0.25, y - s * 0.1, s * 0.38);
    gfx.fillCircle(x + s * 0.25, y - s * 0.1, s * 0.38);
  }

  _burst(x, y, color, n) {
    for (let i = 0; i < n; i++) {
      const dot = this.add.circle(x, y, 3, color).setDepth(15);
      const angle = (Math.PI * 2 * i) / n + Math.random() * 0.4;
      const spd   = 60 + Math.random() * 80;
      this.tweens.add({
        targets: dot,
        x: x + Math.cos(angle) * spd,
        y: y + Math.sin(angle) * spd,
        alpha: 0, duration: 500 + Math.random() * 300,
        ease: 'Power2', onComplete: () => dot.destroy(),
      });
    }
  }

  _gameOver() {
    this._transitioning = true;
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start(SCENES.GAMEOVER);
    });
  }
}
