// ─── Game constants ───────────────────────────────────────────────
export const W = 960;
export const H = 560;
export const GY = 490;        // ground Y (top of ground platform)

// Phaser Arcade Physics (px / s²  or  px / s)
export const GRAVITY  = 1200; // px/s²
export const JUMP_VEL = -620; // px/s  (negative = upward)
export const MOVE_SPD = 220;  // px/s  horizontal
export const FRICTION = 0.72; // velocity multiplier when no key held

export const P1W = 2100;      // Phase-1 world width
export const P2W = 2400;      // Phase-2 world width

export const PLAYER_HP   = 5;
export const INV_FRAMES  = 65; // invincibility frames after hit (at 60fps)
export const ATK_FRAMES  = 16; // attack active frames

// Scene keys – single source of truth
export const SCENES = {
  BOOT:       'Boot',
  TITLE:      'Title',
  OBJECTIVES: 'Objectives',
  INFO:       'Info',
  ALERT_FULL: 'AlertFull',
  ALERT_OVER: 'AlertOver',
  PHASE1:     'Phase1',
  PHASE2:     'Phase2',
  WIN:        'Win',
  GAMEOVER:   'GameOver',
};
