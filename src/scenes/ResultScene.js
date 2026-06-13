import * as audio from '../audio.js';
import * as storage from '../storage.js';

const RANK_THRESHOLDS = { Bronze: 0, Silver: 10, Gold: 25, Diamond: 50 };

function nextRankInfo(currentRank, totalStars) {
  const order = ['Bronze', 'Silver', 'Gold', 'Diamond'];
  const idx = order.indexOf(currentRank);
  if (idx < 0 || idx >= order.length - 1) return null;
  const nextRank = order[idx + 1];
  const need = RANK_THRESHOLDS[nextRank] - totalStars;
  return need > 0 ? { nextRank, need } : null;
}

export default class ResultScene extends Phaser.Scene {
  constructor() { super('Result'); }

  create(data) {
    this.token = data.token;
    const r = data.result;
    const win = r.result === 'win';
    const w = this.scale.width, h = this.scale.height;

    // Background
    this.cameras.main.setBackgroundColor(win ? '#1a1a2e' : '#2d1a1a');

    // VICTORY / DEFEAT title
    const title = this.add.text(w / 2, h * 0.10, win ? 'VICTORY!' : 'DEFEAT', {
      fontFamily: '"Press Start 2P"', fontSize: '22px', color: win ? '#ffd700' : '#e94560', align: 'center',
    }).setOrigin(0.5).setScale(0);
    this.tweens.add({ targets: title, scale: 1, duration: 500, ease: 'Back.Out' });

    // Stars (reveal one at a time)
    const stars = r.stars || 0;
    const starText = this.add.text(w / 2, h * 0.30, '☆ ☆ ☆', {
      fontFamily: 'Sarabun', fontSize: '48px', color: '#ffd700', align: 'center',
    }).setOrigin(0.5);

    for (let i = 0; i < stars; i++) {
      this.time.delayedCall(700 + i * 400, () => {
        const arr = starText.text.split(' ');
        arr[i] = '⭐';
        starText.setText(arr.join(' '));
        audio.play('correct');
      });
    }

    // XP gained
    this.add.text(w / 2, h * 0.45, `+${r.xp_gained} XP`, {
      fontFamily: 'Sarabun', fontSize: '18px', color: '#a29bfe', fontStyle: 'bold',
    }).setOrigin(0.5);

    // Level-up badge
    if (r.level_up) {
      this.time.delayedCall(1500, () => {
        const badge = this.add.text(w / 2, h * 0.55, `🎉 LEVEL UP! Lv.${r.user.level}`, {
          fontFamily: 'Sarabun', fontSize: '14px', color: '#fff', backgroundColor: '#e94560', padding: { x: 14, y: 8 },
        }).setOrigin(0.5).setScale(0);
        this.tweens.add({ targets: badge, scale: 1, duration: 400, ease: 'Back.Out' });
        this.tweens.add({ targets: badge, scale: 1.08, duration: 600, yoyo: true, repeat: -1, delay: 400 });
        audio.play('levelup');
      });
    }

    // Progression hint
    const u = r.user;
    const hint = nextRankInfo(u.rank, u.total_stars);
    const hintText = hint
      ? `ดาวสะสม ${u.total_stars} ⭐ · ไป ${hint.nextRank} อีก ${hint.need} ⭐`
      : `ดาวสะสม ${u.total_stars} ⭐ · ${u.rank} 🏆`;
    this.add.text(w / 2, h * 0.72, hintText, {
      fontFamily: 'Sarabun', fontSize: '12px', color: '#ffd700', align: 'center',
    }).setOrigin(0.5);

    // Buttons
    const btnMap = this.add.dom(w / 2, h * 0.90).createFromHTML(`
      <div style="display:flex;gap:8px;width:${w - 32}px;">
        <button id="kb-r-home" style="flex:1;padding:12px;background:#2d3748;color:#ffd700;border:none;border-radius:8px;font-family:Sarabun;font-size:13px;font-weight:bold;cursor:pointer;">🏠 Map</button>
        <button id="kb-r-next" style="flex:1;padding:12px;background:#e94560;color:#fff;border:none;border-radius:8px;font-family:Sarabun;font-size:13px;font-weight:bold;cursor:pointer;">▶ ${win ? 'ด่านถัดไป' : 'เล่นซ้ำ'}</button>
      </div>
    `);
    btnMap.node.querySelector('#kb-r-home').addEventListener('click', () => {
      audio.play('click');
      this.scene.start('StageMap', { token: this.token });
    });
    btnMap.node.querySelector('#kb-r-next').addEventListener('click', () => {
      audio.play('click');
      this.scene.start('StageMap', { token: this.token });
    });

    // Update stored user
    storage.set('user', u);
  }
}
