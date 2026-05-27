import Phaser from 'phaser';

export default class Neutrophil extends Phaser.Physics.Arcade.Sprite {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x  spawn x
   * @param {number} y  spawn y (above screen, e.g. -80)
   */
  constructor(scene, x, y) {
    super(scene, x, y, 'enemy');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(8);
    this.body.setSize(34, 46);
    this.body.setOffset(8, 2);

    this.hp       = 5;
    this.maxHp    = 5;
    this.hitTimer = 0;
    this.dead     = false;
    this.landed   = false;
    this.vx       = 1.5 * 60; // px/s
    this.patrolMin = 650;
    this.patrolMax = 1100;

    this.hpBar = scene.add.graphics().setDepth(20);
    this._drawHpBar();
  }

  update() {
    if (this.dead) return;

    if (!this.landed) {
      // Wait for Phaser gravity + platform collider to land it
      if (this.body.blocked.down) {
        this.landed = true;
        this.setVelocityX(this.vx);
      }
      this._drawHpBar();
      return;
    }

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
  }

  takeDamage(n = 1) {
    if (this.hitTimer > 0 || this.dead) return false;
    this.hp = Math.max(0, this.hp - n);
    this.hitTimer = 22;
    this.setTint(0xffc0ff);
    this.scene.time.delayedCall(100, () => {
      if (!this.dead) this.clearTint();
    });
    this._drawHpBar();
    if (this.hp === 0) {
      this.dead = true;
      this.setVelocity(0, 0);
      this.body.enable = false;
      if (this.hpBar) this.hpBar.destroy();
      this.emit('died');
    }
    return true;
  }

  getHurtRect() {
    return new Phaser.Geom.Rectangle(this.body.x, this.body.y, this.body.width, this.body.height);
  }

  _drawHpBar() {
    if (!this.hpBar || this.dead) return;

    const w = 54;
    const h = 7;
    const x = this.x - w / 2;
    const y = this.body.y - 14;
    const pct = Phaser.Math.Clamp(this.hp / this.maxHp, 0, 1);

    this.hpBar.clear();
    this.hpBar.fillStyle(0x180817, 0.9);
    this.hpBar.fillRect(x, y, w, h);
    this.hpBar.lineStyle(1, 0xffffff, 0.7);
    this.hpBar.strokeRect(x, y, w, h);
    this.hpBar.fillStyle(0x9ee7ff, 1);
    this.hpBar.fillRect(x + 1, y + 1, (w - 2) * pct, h - 2);
  }
}
