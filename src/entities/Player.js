import Phaser from 'phaser';
import { JUMP_VEL, MOVE_SPD, FRICTION, PLAYER_HP, INV_FRAMES, ATK_FRAMES } from '../config.js';

export default class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'player');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(10);

    // Align the physics body with the visible feet in player.png.
    this.body.setSize(42, 54);
    this.body.setOffset(17, 10);
    this.body.setCollideWorldBounds(false);
    this.body.setMaxVelocityY(700);

    this.hp       = PLAYER_HP;
    this.maxHp    = PLAYER_HP;
    this.invTimer = 0;
    this.atkTimer = 0;
    this.facing   = 1;   // 1=right, -1=left
    this.dead     = false;

    // Keyboard keys — created externally, set by scene
    this.cursors  = null;
    this.keyAtk   = null;
    this.keyA     = null;
    this.keyD     = null;
    this.keyW     = null;

    this.sword = scene.add.image(this.x, this.y, 'sword')
      .setDepth(9)
      .setDisplaySize(48, 48)
      .setVisible(true);
  }

  /** Call from scene.create() after cursors are set up */
  setKeys(cursors, keyAtk, extraKeys = {}) {
    this.cursors = cursors;
    this.keyAtk  = keyAtk;
    this.keyA    = extraKeys.left || null;
    this.keyD    = extraKeys.right || null;
    this.keyW    = extraKeys.up || null;
  }

  update() {
    if (this.dead) {
      this._updateSwordVisual();
      return;
    }

    const { left, right, up, space } = this.cursors;
    const leftDown = left.isDown || (this.keyA && this.keyA.isDown);
    const rightDown = right.isDown || (this.keyD && this.keyD.isDown);
    const jumpDown = up.isDown || space.isDown || (this.keyW && this.keyW.isDown);

    // Horizontal
    if (leftDown) {
      this.setVelocityX(-MOVE_SPD);
      this.facing = -1;
      this.setFlipX(true);
    } else if (rightDown) {
      this.setVelocityX(MOVE_SPD);
      this.facing = 1;
      this.setFlipX(false);
    } else {
      this.setVelocityX(this.body.velocity.x * FRICTION);
    }

    // Jump (only when on ground)
    if (jumpDown && this.body.blocked.down) {
      this.setVelocityY(JUMP_VEL);
    }

    // Attack
    if (this.keyAtk && Phaser.Input.Keyboard.JustDown(this.keyAtk)) {
      this.atkTimer = ATK_FRAMES;
    }
    if (this.atkTimer > 0) this.atkTimer--;

    // Invincibility flash
    if (this.invTimer > 0) {
      this.invTimer--;
      this.setAlpha(Math.floor(this.invTimer / 5) % 2 === 0 ? 0.35 : 1);
    } else {
      this.setAlpha(1);
    }

    this._updateSwordVisual();
  }

  get isAttacking()  { return this.atkTimer  > 0; }
  get isInvincible() { return this.invTimer  > 0; }

  /**
   * Returns Phaser.Geom.Rectangle for sword hitbox, or null if not attacking.
   * Coords are in world space.
   */
  getSwordRect() {
    if (!this.isAttacking) return null;
    const sx = this.body.x;
    const sy = this.body.y;
    if (this.facing === 1) {
      return new Phaser.Geom.Rectangle(sx + this.body.width - 2, sy + 10, 46, 24);
    }
    return new Phaser.Geom.Rectangle(sx - 44, sy + 10, 46, 24);
  }

  /** Inset hitbox for taking damage (smaller than visual). */
  getHurtRect() {
    return new Phaser.Geom.Rectangle(
      this.body.x + 4,
      this.body.y + 4,
      this.body.width - 8,
      this.body.height - 8
    );
  }

  takeDamage(n = 1) {
    if (this.isInvincible || this.dead) return;
    this.hp -= n;
    this.invTimer = INV_FRAMES;
    if (this.hp <= 0) {
      this.hp   = 0;
      this.dead = true;
      this.emit('died');
    }
  }

  heal(n = 1) {
    this.hp = Math.min(this.hp + n, this.maxHp);
  }

  syncVisuals() {
    this._updateSwordVisual();
  }

  _updateSwordVisual() {
    if (!this.sword) return;

    if (this.dead) {
      this.sword.setVisible(false);
      return;
    }

    const attacking = this.isAttacking;
    const x = attacking
      ? (this.facing === 1 ? this.body.x + this.body.width + 20 : this.body.x - 20)
      : (this.facing === 1 ? this.body.x + 12 : this.body.x + this.body.width - 12);
    const y = attacking ? this.body.y + 23 : this.body.y + 35;

    this.sword
      .setVisible(true)
      .setDepth(attacking ? 12 : 9)
      .setPosition(x, y)
      .setFlipX(this.facing < 0)
      .setAngle(attacking
        ? (this.facing === 1 ? -18 : 18)
        : (this.facing === 1 ? 58 : -58))
      .setAlpha(this.alpha);
  }
}
