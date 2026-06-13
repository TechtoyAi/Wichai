import BootScene from './scenes/BootScene.js';
import AuthScene from './scenes/AuthScene.js';
import StageMapScene from './scenes/StageMapScene.js';
import BattleScene from './scenes/BattleScene.js';
import ResultScene from './scenes/ResultScene.js';
import { GAME_WIDTH, GAME_HEIGHT } from './config.js';

const config = {
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#1a1a2e',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  dom: { createContainer: true },
  scene: [BootScene, AuthScene, StageMapScene, BattleScene, ResultScene],
};

new Phaser.Game(config);
