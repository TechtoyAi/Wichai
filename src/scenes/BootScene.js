import { SPRITES, SFX } from '../manifest.js';
import * as audio from '../audio.js';
import * as storage from '../storage.js';

export default class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  preload() {
    Object.entries(SPRITES).forEach(([key, path]) => this.load.image(key, path));
    // Progress bar
    const w = this.scale.width, h = this.scale.height;
    const barBg = this.add.rectangle(w / 2, h / 2, w * 0.7, 8, 0x2d3748);
    const barFill = this.add.rectangle(w / 2 - (w * 0.7) / 2, h / 2, 0, 8, 0xffd700).setOrigin(0, 0.5);
    this.add.text(w / 2, h / 2 - 24, 'Knowledge Battle', {
      fontFamily: '"Press Start 2P"', fontSize: '14px', color: '#ffd700',
    }).setOrigin(0.5);
    this.load.on('progress', v => barFill.width = (w * 0.7) * v);
  }

  create() {
    // Mobile audio unlock — resume Howler AudioContext on first user gesture
    const unlock = () => {
      if (window.Howler && Howler.ctx && Howler.ctx.resume) Howler.ctx.resume();
      window.removeEventListener('touchend', unlock);
      window.removeEventListener('click', unlock);
    };
    window.addEventListener('touchend', unlock, { once: true });
    window.addEventListener('click', unlock, { once: true });

    // Audio loaded separately via Howler (not Phaser loader)
    audio.load(SFX);

    // Auto-login if token exists
    const token = storage.get('token');
    this.time.delayedCall(300, () => this.scene.start(token ? 'StageMap' : 'Auth', { token }));
  }
}
