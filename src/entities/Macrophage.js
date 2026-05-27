import Phaser from 'phaser';
import { P2W } from '../config.js';

export default class Macrophage extends Phaser.Physics.Arcade.Sprite {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} y
   */
  constructor(scene, x, y) {
    super(scene, x, y, 'boss');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(8);
    this.body.setSize(54, 64);
    this.body.setOffset(11, 7);
    // Boss keeps a small hover, but the body is aligned to the visible sprite.
    this.body.setAllowGravity(false);

    this.hp        = 12;
    this.maxHp     = 12;
    this.hitTimer  = 0;
    this.dead      = false;
    this.shootTimer = 0;
    this.vx        = 2.2 * 60; // px/s
    this.patrolMin = 1100;
    this.patrolMax = P2W - 110;
    this.startPatrol(1);

    // Bullet group (managed by scene physics)
    this.bullets = scene.physics.add.group({ allowGravity: true, gravityY: 120 });

    this.hpBar = scene.add.graphics().setDepth(20);
    this._drawHpBar();
  }

  /**
   * @param {number} playerX
   * @param {number} playerY
   */
  update(playerX, playerY) {
    if (this.dead) return;

    // Patrol
    if (this.x < this.patrolMin) {
      this.setVelocityX(Math.abs(this.vx));
      this.setFlipX(false);
    } else if (this.x > this.patrolMax) {
      this.setVelocityX(-Math.abs(this.vx));
      this.setFlipX(true);
    }

    if (this.hitTimer > 0) this.hitTimer--;
    this._drawHpBar();

    // Shoot at player
    this.shootTimer++;
    if (this.shootTimer >= 85) {
      this.shootTimer = 0;
      const bx = this.x;
      const by = this.y + 20;
      const bullet = this.bullets.create(bx, by, 'capsule');
      bullet.setDepth(7);
      if (!bullet.texture || bullet.texture.key === '__MISSING') {
        bullet.setDisplaySize(16, 16);
      } else {
        bullet.setDisplaySize(18, 18);
      }
      const dx = playerX - bx;
      const speed = 210;
      const vx = dx > 0 ? speed : -speed;
      bullet.setVelocity(vx, -80);
      // Kill bullet when off screen
      bullet.setMaxVelocity(400, 400);
    }

    // Remove off-screen bullets
    this.bullets.getChildren().forEach(b => {
      if (b.y > 700 || b.x < -100 || b.x > P2W + 100) b.destroy();
    });
  }

  startPatrol(direction = 1) {
    const dir = direction >= 0 ? 1 : -1;
    this.setVelocityX(Math.abs(this.vx) * dir);
    this.setFlipX(dir < 0);
  }

  stopPatrol() {
    this.setVelocityX(0);
  }

  syncVisuals() {
    this._drawHpBar();
  }

  takeDamage(n = 1) {
    if (this.hitTimer > 0 || this.dead) return;
    this.hp -= n;
    this.hitTimer = 28;
    this.setTint(0xb8ffb8);
    this.scene.time.delayedCall(120, () => {
      if (!this.dead) this.clearTint();
    });
    this._drawHpBar();
    if (this.hp <= 0) {
      this.hp = 0;
      this.dead = true;
      this.hpBar.destroy();
      this.bullets.clear(true, true);
      this.emit('died');
    }
  }

  getHurtRect() {
    return new Phaser.Geom.Rectangle(this.x - 42, this.y - 42, 84, 78);
  }

  getDamageRect() {
    return new Phaser.Geom.Rectangle(
      this.body.x + 14,
      this.body.y + 12,
      this.body.width - 28,
      this.body.height - 22
    );
  }

  _drawHpBar() {
    if (!this.hpBar || this.dead) return;

    const w = 76;
    const h = 8;
    const x = this.x - w / 2;
    const y = this.body.y - 16;
    const pct = Phaser.Math.Clamp(this.hp / this.maxHp, 0, 1);

    this.hpBar.clear();
    this.hpBar.fillStyle(0x101808, 0.9);
    this.hpBar.fillRect(x, y, w, h);
    this.hpBar.lineStyle(1, 0xffffff, 0.75);
    this.hpBar.strokeRect(x, y, w, h);
    this.hpBar.fillStyle(0x8cff7c, 1);
    this.hpBar.fillRect(x + 1, y + 1, (w - 2) * pct, h - 2);
  }
}
