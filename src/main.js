import Phaser from 'phaser';
import { W, H, GRAVITY, SCENES } from './config.js';

import BootScene       from './scenes/BootScene.js';
import TitleScene      from './scenes/TitleScene.js';
import ObjectivesScene from './scenes/ObjectivesScene.js';
import InfoScene       from './scenes/InfoScene.js';
import AlertFullScene  from './scenes/AlertFullScene.js';
import AlertOverScene  from './scenes/AlertOverScene.js';
import Phase1Scene     from './scenes/Phase1Scene.js';
import Phase2Scene     from './scenes/Phase2Scene.js';
import WinScene        from './scenes/WinScene.js';
import GameOverScene   from './scenes/GameOverScene.js';

new Phaser.Game({
  type: Phaser.AUTO,
  width: W,
  height: H,
  backgroundColor: '#050d1f',
  parent: 'game-container',
  pixelArt: false,
  roundPixels: true,
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: GRAVITY }, debug: false },
  },
  scene: [
    BootScene,
    TitleScene,
    ObjectivesScene,
    InfoScene,
    AlertFullScene,
    AlertOverScene,
    Phase1Scene,
    Phase2Scene,
    WinScene,
    GameOverScene,
  ],
});
