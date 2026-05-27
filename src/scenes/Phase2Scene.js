import Phaser from 'phaser';
import { W, H, GY, P2W, SCENES } from '../config.js';
import Player      from '../entities/Player.js';
import Neutrophil  from '../entities/Neutrophil.js';
import Macrophage  from '../entities/Macrophage.js';

/*
  P2SUB sub-states:
    'gameplay'       – initial, player explores
    'neutro_falling' – neutrophil spawned, dropping from ceiling
    'fight_neutro'   – neutrophil landed + alert over, player fights
    'neutro_dead'    – neutrophil killed, player must touch cell
    'macro_cutscene' – player touched cell, macrophage spawned, alert playing
    'fight_macro'    – macrophage fight active
*/

export default class Phase2Scene extends Phaser.Scene {
  constructor() { super(SCENES.PHASE2); }

  // ─────────────────────────────────────────────────────────────────
  create() {
    this.worldW  = P2W;
    this.p2sub   = 'gameplay';
    this._transitioning = false;

    this.physics.world.setBounds(0, -400, P2W, H + 500);

    // ── Background ───────────────────────────────────────────────
    this._buildBg();

    // ── Platforms ────────────────────────────────────────────────
    this.platforms = this._buildPlatforms();

    // ── Read spawn objects ────────────────────────────────────────
    const map    = this.make.tilemap({ key: 'phase2' });
    const spLayer = map.getObjectLayer('spawns');
    const spwns   = spLayer ? spLayer.objects : [];

    const startObj  = spwns.find(o => o.name === 'player_start');
    this._cellObj   = spwns.find(o => o.name === 'cell');
    this._neutroObj = spwns.find(o => o.name === 'neutro_spawn');
    this._macroObj  = spwns.find(o => o.name === 'macro_spawn');

    // ── Cell target ──────────────────────────────────────────────
    this._buildCell(this._cellObj);

    // ── Player ───────────────────────────────────────────────────
    this.player = new Player(this, startObj.x, startObj.y);
    const cursors = this.input.keyboard.createCursorKeys();
    const keyAtk  = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);
    const keyA    = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    const keyD    = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    const keyW    = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this._shiftKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    this.player.setKeys(cursors, keyAtk, { left: keyA, right: keyD, up: keyW });

    // ── Colliders ────────────────────────────────────────────────
    this.physics.add.collider(this.player, this.platforms);

    // ── Camera ───────────────────────────────────────────────────
    this.cameras.main.setBounds(0, 0, P2W, H);
    this.cameras.main.startFollow(this.player, true, 0.12, 1);
    this.cameras.main.fadeIn(350, 0, 0, 0);

    // ── HUD ──────────────────────────────────────────────────────
    this._buildHUD();

    // ── Event listeners from AlertOverScene ─────────────────────
    this.events.on('neutroAlertDone',   this._onNeutroAlertDone,   this);
    this.events.on('neutroDeadMsgDone', this._onNeutroDeadMsgDone, this);
    this.events.on('macroAlertDone',    this._onMacroAlertDone,    this);

    this.neutro = null;
    this.macro  = null;
    this._playerControlsLocked = false;
    this._neutroDeadFired = false;
    this._macroStarted = false;
    this._macroEntrance = null;
    this._macroSpeech = null;

    this._launchAlert([
      'S. PNEUMONIAE',
      '',
      'A CÁPSULA POLISSACARÍDICA AJUDA A BACTÉRIA',
      'A ESCAPAR DA FAGOCITOSE.',
    ], 220, 'phase2EduDone');
  }

  // ─────────────────────────────────────────────────────────────────
  update(time, delta) {
    if (this._transitioning) return;

    if (this._playerControlsLocked) {
      this.player.atkTimer = 0;
      this.player.syncVisuals();
    } else {
      this.player.update();
      if (Phaser.Input.Keyboard.JustDown(this._shiftKey)) this.player.atkTimer = 16;
    }

    this._updateSubState();
    this._updateHUD();

    // Respawn if fallen
    if (this.player.y > H + 150) {
      this.player.takeDamage(1);
      this.player.setPosition(
        Math.max(30, this.cameras.main.scrollX + 80), GY - 60);
      this.player.setVelocity(0, 0);
    }

    if (this.player.dead) this._gameOver();
  }

  _launchAlert(lines, timer, doneEvent) {
    if (this.scene.isActive(SCENES.ALERT_OVER)) {
      this.scene.stop(SCENES.ALERT_OVER);
    }
    this.scene.launch(SCENES.ALERT_OVER, {
      lines,
      timer,
      parentScene: SCENES.PHASE2,
      doneEvent,
    });
  }

  // ─────────────────────────────────────────────────────────────────
  _updateSubState() {
    switch (this.p2sub) {
      case 'gameplay':
        // Trigger neutrophil when player advances right
        if (this.player.x > 700 && !this.neutro) {
          this._spawnNeutro();
        }
        break;

      case 'neutro_falling':
      case 'fight_neutro':
        if (this.neutro) {
          this.neutro.update();
          this._checkSwordVsNeutro();
          this._checkEnemyHitsPlayer(this.neutro);
          if (this.neutro.dead) this._neutroKilled();
        }
        break;

      case 'neutro_dead':
        // Wait for player to touch cell
        if (this._cellObj && this.player.x + 20 > this._cellObj.x &&
            this.player.x < this._cellObj.x + this._cellObj.width &&
            this.player.y + this.player.height > this._cellObj.y &&
            this.player.y < this._cellObj.y + this._cellObj.height) {
          this._touchedCell();
        }
        break;

      case 'macro_cutscene':
        if (this.macro) {
          this._updateMacroEntrance();
        }
        break;

      case 'fight_macro':
        if (this.macro) {
          this.macro.update(this.player.x, this.player.y);
          this._checkSwordVsMacro();
          this._checkBossHitsPlayer();
          if (this.macro.dead && !this._macroStarted) {
            this._macroStarted = true;
            this._macroDefeated();
          }
        }
        break;
    }
  }

  // ─────────────────────────────────────────────────────────────────
  _spawnNeutro() {
    const nx = this._neutroObj ? this._neutroObj.x : 850;
    this.neutro = new Neutrophil(this, nx, -80);
    this._neutroDeadFired = false;
    this.neutro.once('died', this._neutroKilled, this);
    this.physics.add.collider(this.neutro, this.platforms);
    this.p2sub = 'neutro_falling';

    this._launchAlert([
      'CUIDADO!',
      '',
      'NEUTRÓFILOS SÃO FAGÓCITOS RÁPIDOS',
      'E ATACAM MICRORGANISMOS INVASORES.',
    ], 200, 'neutroAlertDone');
  }

  _onNeutroAlertDone() {
    if (this.p2sub === 'neutro_falling') this.p2sub = 'fight_neutro';
  }

  _neutroKilled() {
    if (this.neutro && !this._neutroDeadFired) {
      this._neutroDeadFired = true;
      this._burst(this.neutro.x, this.neutro.y, 0x88aaff, 16);
      this._floatText(this.neutro.x, this.neutro.y - 10, 'Neutrófilo derrotado!', '#aaddff');
      this.neutro.setVisible(false);
      this.p2sub = 'neutro_dead';

      this._launchAlert([
        'CÁPSULA BACTERIANA',
        '',
        'ELA DIFICULTA A FAGOCITOSE;',
        'INFECTE A CÉLULA E PROSSIGA!',
      ], 280, 'neutroDeadMsgDone');
    }
  }

  _onNeutroDeadMsgDone() { /* no state change needed; player chooses when to touch cell */ }

  _touchedCell() {
    if (this.macro) return; // already spawned
    this.p2sub = 'macro_cutscene';
    this._playerControlsLocked = true;
    this.player.atkTimer = 0;
    if (this.scene.isActive(SCENES.ALERT_OVER)) {
      this.scene.stop(SCENES.ALERT_OVER);
    }

    const targetX = this._macroObj ? this._macroObj.x : 1700;
    const startX = this.cameras.main.scrollX - 90;
    const playerSafeX = Math.min(P2W - 120, targetX + 230);
    const my = GY - 34;
    this.macro = new Macrophage(this, startX, my);
    this.macro.stopPatrol();
    this.macro.setFlipX(false);
    this.macro.setVelocityX(185);
    this._macroEntrance = {
      targetX,
      playerSafeX,
      dialogStarted: false,
    };

    // Macrophage bullets can hurt player
    this.physics.add.overlap(this.player, this.macro.bullets,
      (player, bullet) => { bullet.destroy(); player.takeDamage(1); },
      null, this);
  }

  _updateMacroEntrance() {
    if (!this.macro || !this._macroEntrance) return;

    this._walkPlayerToMacroSafeArea();
    this.macro.syncVisuals();

    if (this._macroEntrance.dialogStarted) return;

    const macroReady = this.macro.x >= this._macroEntrance.targetX;
    const playerReady = Math.abs(this.player.x - this._macroEntrance.playerSafeX) <= 6;
    if (!macroReady || !playerReady) return;

    this.macro.setPosition(this._macroEntrance.targetX, this.macro.y);
    this.macro.stopPatrol();
    this.player.setPosition(this._macroEntrance.playerSafeX, this.player.y);
    this.player.setVelocityX(0);
    this.player.facing = -1;
    this.player.setFlipX(true);
    this.player.syncVisuals();
    this._macroEntrance.dialogStarted = true;
    this._showMacroSpeech();
  }

  _walkPlayerToMacroSafeArea() {
    const targetX = this._macroEntrance.playerSafeX;
    const dx = targetX - this.player.x;

    if (Math.abs(dx) <= 6) {
      this.player.setPosition(targetX, this.player.y);
      this.player.setVelocityX(0);
      this.player.facing = -1;
      this.player.setFlipX(true);
      this.player.syncVisuals();
      return;
    }

    const dir = dx > 0 ? 1 : -1;
    this.player.facing = dir;
    this.player.setFlipX(dir < 0);
    this.player.setVelocityX(150 * dir);
    this.player.syncVisuals();
  }

  _showMacroSpeech() {
    this._destroyMacroSpeech();

    const panel = this.add.graphics().setScrollFactor(0).setDepth(40);
    panel.fillStyle(0x070512, 0.88);
    panel.fillRoundedRect(180, 92, 600, 164, 8);
    panel.lineStyle(3, 0x8cff7c, 1);
    panel.strokeRoundedRect(180, 92, 600, 164, 8);

    const name = this.add.text(W / 2, 114, 'MACRÓFAGO', {
      fontSize: '14px',
      fontFamily: '"Courier New"',
      color: '#8cff7c',
      fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(41);

    const text = this.add.text(W / 2, 154, 'SUA JORNADA\nACABA AQUI,\nSTREPTAPADA...', {
      fontSize: '28px',
      fontFamily: '"Courier New"',
      color: '#fff1a8',
      fontStyle: 'bold',
      align: 'center',
      lineSpacing: 4,
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(41);

    this._macroSpeech = [panel, name, text];
    this.time.delayedCall(3200, () => {
      this._destroyMacroSpeech();
      this._onMacroAlertDone();
    });
  }

  _destroyMacroSpeech() {
    if (!this._macroSpeech) return;
    this._macroSpeech.forEach(obj => obj.destroy());
    this._macroSpeech = null;
  }

  _onMacroAlertDone() {
    if (this.p2sub === 'macro_cutscene') {
      this._playerControlsLocked = false;
      this.p2sub = 'fight_macro';
      this.macro.startPatrol(1);
    }
  }

  _macroDefeated() {
    this._burst(this.macro.x, this.macro.y, 0xffff44, 28);
    this._floatText(this.macro.x, this.macro.y - 20, 'MACRÓFAGO DESTRUÍDO!', '#ffff44');
    this.macro.setVisible(false);
    this._transitioning = true;
    this.time.delayedCall(1000, () => {
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () =>
        this.scene.start(SCENES.WIN));
    });
  }

  // ─────────────────────────────────────────────────────────────────
  _checkSwordVsNeutro() {
    const sw = this.player.getSwordRect();
    if (!sw || !this.neutro || this.neutro.dead) return;
    if (Phaser.Geom.Intersects.RectangleToRectangle(sw, this.neutro.getHurtRect())) {
      const hitLanded = this.neutro.takeDamage(1);
      if (!hitLanded) return;
      if (this.neutro.hitTimer === 22) { // just hit
        this._burst(this.neutro.x, this.neutro.y, 0xaaaaff, 6);
      }
      if (this.neutro.dead) this._neutroKilled();
    }
  }

  _checkSwordVsMacro() {
    const sw = this.player.getSwordRect();
    if (!sw || !this.macro || this.macro.dead) return;
    if (Phaser.Geom.Intersects.RectangleToRectangle(sw, this.macro.getHurtRect())) {
      this.macro.takeDamage(1);
      if (this.macro.hitTimer === 28) {
        this._burst(this.macro.x, this.macro.y, 0x88ff88, 8);
      }
    }
  }

  _checkEnemyHitsPlayer(enemy) {
    if (!enemy || enemy.dead) return;
    const hurt = this.player.getHurtRect();
    const enemyDamage = enemy.getDamageRect ? enemy.getDamageRect() : enemy.getHurtRect();
    if (Phaser.Geom.Intersects.RectangleToRectangle(hurt, enemyDamage)) {
      this.player.takeDamage(1);
    }
  }

  _checkBossHitsPlayer() {
    if (!this.macro || this.macro.dead) return;
    const hurt = this.player.getHurtRect();
    if (Phaser.Geom.Intersects.RectangleToRectangle(hurt, this.macro.getDamageRect())) {
      this.player.takeDamage(1);
    }
  }

  // ─────────────────────────────────────────────────────────────────
  _buildBg() {
    // Lung interior gradient
    const sky = this.add.graphics().setScrollFactor(0).setDepth(0);
    sky.fillGradientStyle(0x3a0a1a, 0x3a0a1a, 0x6a1030, 0x6a1030, 1);
    sky.fillRect(0, 0, W, H);

    // Organic blobs (vein-like background)
    const blobs = this.add.graphics().setScrollFactor(0.1).setDepth(1);
    blobs.fillStyle(0xc8325a, 0.1);
    for (let i = 0; i < 18; i++) {
      const bx = i * (P2W / 18) + Math.sin(i * 1.7) * 40;
      const by = 60 + Math.sin(i * 0.8) * 40;
      const br = 55 + Math.sin(i * 1.3) * 20;
      blobs.fillCircle(bx, by, br);
    }

    // Ground visual
    const gnd = this.add.graphics().setDepth(3);
    gnd.fillStyle(0x8b2040); gnd.fillRect(0, GY, P2W, H - GY);
    gnd.fillStyle(0xc05070); gnd.fillRect(0, GY - 8, P2W, 10);
    // Tissue bumps on top of ground
    gnd.fillStyle(0xe07090);
    for (let px = 0; px < P2W; px += 10) gnd.fillRect(px, GY - 8, 5, 7);
  }

  _buildPlatforms() {
    const map    = this.make.tilemap({ key: 'phase2' });
    const pLayer = map.getObjectLayer('platforms');
    const layer  = pLayer || { objects: [] };
    const group  = this.physics.add.staticGroup();

    layer.objects.forEach(obj => {
      const cx = obj.x + obj.width  / 2;
      const cy = obj.y + obj.height / 2;

      if (obj.type === 'ground') {
        const g = this.add.graphics().setDepth(3);
        g.fillStyle(0x8b2040); g.fillRect(obj.x, obj.y, obj.width, obj.height);
      } else {
        // Lung tissue platform
        const g = this.add.graphics().setDepth(5);
        g.fillStyle(0x8b2040); g.fillRect(obj.x, obj.y, obj.width, obj.height);
        g.fillStyle(0xc05070); g.fillRect(obj.x, obj.y - 10, obj.width, 12);
        g.fillStyle(0xe07090);
        for (let px = obj.x; px < obj.x + obj.width; px += 10)
          g.fillRect(px, obj.y - 10, 5, 7);
      }

      const body = group.create(cx, cy, '__DEFAULT');
      body.setDisplaySize(obj.width, obj.height).setVisible(false).refreshBody();
    });

    return group;
  }

  _buildCell(obj) {
    if (!obj) return;
    const cx = obj.x + obj.width  / 2;
    const cy = obj.y + obj.height / 2;

    this._cellGfx = this.add.graphics().setDepth(6);
    // Draw cell (will pulse in update via tween)
    this._cellGfx.fillStyle(0xcc4466); this._cellGfx.fillEllipse(cx, cy, obj.width, obj.height);
    this._cellGfx.fillStyle(0xff6688); this._cellGfx.fillEllipse(cx, cy, obj.width * 0.6, obj.height * 0.6);
    this.add.text(cx, obj.y - 10, 'CÉLULA', {
      fontSize: '10px', fontFamily: '"Courier New"', color: '#ffe0ea', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(7);

    // Pulse glow
    const glow = this.add.graphics().setDepth(5);
    const cellTarget = { v: 0 };
    this.tweens.add({
      targets: cellTarget, v: Math.PI * 2, duration: 1800, repeat: -1,
      onUpdate: () => {
        glow.clear();
        glow.fillStyle(0xff88aa, 0.14 + 0.08 * Math.sin(cellTarget.v));
        glow.fillCircle(cx, cy, 70);
      },
    });
  }

  // ─────────────────────────────────────────────────────────────────
  _buildHUD() {
    this._hudBg = this.add.graphics().setScrollFactor(0).setDepth(25);
    this._hearts = [];
    for (let i = 0; i < 5; i++) {
      this._hearts.push(this.add.graphics().setScrollFactor(0).setDepth(26));
    }
    this._phaseLabel = this.add.text(W - 14, 30, '🫁 FASE 2 — Pulmão', {
      fontSize: '11px', fontFamily: '"Courier New"', color: '#8090cc', fontStyle: 'bold',
    }).setOrigin(1, 0.5).setScrollFactor(0).setDepth(26);
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
      const angle = (Math.PI * 2 * i) / n + Math.random() * 0.5;
      const spd   = 50 + Math.random() * 100;
      this.tweens.add({
        targets: dot,
        x: x + Math.cos(angle) * spd,
        y: y + Math.sin(angle) * spd,
        alpha: 0, duration: 500,
        onComplete: () => dot.destroy(),
      });
    }
  }

  _floatText(x, y, msg, color) {
    const txt = this.add.text(x, y, msg, {
      fontSize: '14px', fontFamily: '"Courier New"', color, fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(16);
    this.tweens.add({
      targets: txt, y: y - 60, alpha: 0, duration: 1200,
      onComplete: () => txt.destroy(),
    });
  }

  _gameOver() {
    this._transitioning = true;
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () =>
      this.scene.start(SCENES.GAMEOVER));
  }
}
