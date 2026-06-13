import { api } from '../api.js';
import * as storage from '../storage.js';
import * as audio from '../audio.js';
import { showLeaderboard } from './LeaderboardModal.js';

const NEW_DAYS = 7;

function renderHTML(stages, user) {
  const now = Date.now();
  const firstUnplayedIdx = stages.findIndex(s => (s.my_stars || 0) === 0);
  const newest = stages
    .map((s, i) => ({ i, daysOld: (now - new Date(s.created_at).getTime()) / 86400000 }))
    .filter(x => x.daysOld <= NEW_DAYS)
    .sort((a, b) => a.daysOld - b.daysOld)[0];

  const cards = stages.map((s, i) => {
    const seq = (s.my_stars || 0) > 0 ? '✓' : String(i + 1);
    const seqClass = (s.my_stars || 0) > 0 ? 'done' : (i === firstUnplayedIdx ? 'current' : '');
    const cardClass = i === firstUnplayedIdx ? 'current' : '';
    const stars = '⭐'.repeat(s.my_stars || 0) + '☆'.repeat(3 - (s.my_stars || 0));
    return `
      <div class="kb-card ${cardClass}" data-idx="${i}" data-id="${escapeHtml(s.stage_id)}">
        ${i > 0 ? '<div class="kb-conn"></div>' : ''}
        <div class="kb-seq ${seqClass}">${seq}</div>
        <div class="kb-monster">${monsterEmoji(s.monster_name)}</div>
        <div class="kb-info">
          <div class="kb-title">${escapeHtml(s.title)}</div>
          <div class="kb-meta">${escapeHtml(s.monster_name)} · ${s.time_limit_sec}s</div>
          <div class="kb-stars">${stars}</div>
        </div>
        <div class="kb-play">▶</div>
      </div>`;
  }).join('');

  const newBanner = newest ? `
    <div class="kb-newbanner" data-scroll="${newest.i}">🆕 มีด่านใหม่! แตะดู</div>` : '';

  return `
    <div id="kb-stagemap">
      <div class="kb-top">
        <div>
          <div class="kb-name">${escapeHtml(user.name)}</div>
          <div class="kb-stats">Lv.${user.level} · ${user.rank} · ⭐ ${user.total_stars} · XP ${user.xp}</div>
        </div>
        <div style="display:flex;gap:6px;">
          <button id="kb-mute" title="เสียง">🔊</button>
          <button id="kb-leader" title="อันดับ">🏆</button>
          <button id="kb-logout" title="ออกจากระบบ">🚪</button>
        </div>
      </div>
      ${newBanner}
      <div id="kb-list">${cards}</div>
    </div>
    <style>
      #kb-stagemap { color:#fff; font-family:Sarabun; padding:12px; width:336px; max-height:616px; overflow-y:auto; box-sizing:border-box; }
      .kb-top { display:flex; justify-content:space-between; align-items:center; padding-bottom:12px; border-bottom:1px solid #2d3748; margin-bottom:12px; }
      .kb-name { font-size:15px; font-weight:bold; }
      .kb-stats { font-size:11px; opacity:0.7; }
      #kb-mute, #kb-leader, #kb-logout { background:#16213e; color:#fff; border:1px solid #2d3748; padding:8px 10px; border-radius:8px; cursor:pointer; }
      .kb-newbanner { background:#e94560; color:#fff; text-align:center; padding:10px; border-radius:8px; margin-bottom:12px; cursor:pointer; font-weight:bold; }
      .kb-card { background:linear-gradient(135deg,#16213e 0%, #1a1a2e 100%); border-radius:12px; padding:14px; display:flex; gap:14px; align-items:center; position:relative; border-left:4px solid #ffd700; margin-left:32px; margin-bottom:14px; cursor:pointer; }
      .kb-card.current { border-left-color:#e94560; box-shadow:0 0 16px rgba(233,69,96,0.3); }
      .kb-seq { position:absolute; left:-34px; top:50%; transform:translateY(-50%); width:28px; height:28px; background:#2d3748; border:2px solid #1a1a2e; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:bold; }
      .kb-seq.done { background:#ffd700; color:#1a1a2e; }
      .kb-seq.current { background:#e94560; }
      .kb-conn { position:absolute; left:-21px; top:-16px; width:2px; height:16px; background:linear-gradient(180deg,#2d3748 0%, #ffd700 100%); }
      .kb-monster { font-size:48px; }
      .kb-info { flex:1; min-width:0; }
      .kb-title { font-size:14px; font-weight:bold; }
      .kb-meta { font-size:11px; opacity:0.6; margin:2px 0 4px; }
      .kb-stars { color:#ffd700; font-size:13px; }
      .kb-play { background:#e94560; color:#fff; padding:6px 12px; border-radius:16px; font-size:12px; font-weight:bold; }
    </style>`;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function monsterEmoji(name) {
  const n = String(name).toLowerCase();
  if (n.includes('slime')) return '👾';
  if (n.includes('goblin')) return '👹';
  if (n.includes('orc')) return '🧌';
  if (n.includes('skeleton')) return '💀';
  return '👾';
}

export default class StageMapScene extends Phaser.Scene {
  constructor() { super('StageMap'); }

  async create(data) {
    this.token = (data && data.token) || storage.get('token');
    if (!this.token) return this.scene.start('Auth');

    const loading = this.add.text(this.scale.width / 2, this.scale.height / 2, 'กำลังโหลด...', {
      fontFamily: 'Sarabun', fontSize: '14px', color: '#ffd700',
    }).setOrigin(0.5);

    let res;
    try { res = await api.stages(this.token); }
    catch (e) {
      loading.destroy();
      storage.del('token');
      return this.scene.start('Auth');
    }
    loading.destroy();

    this.stages = res.stages;
    this.user = res.user;
    storage.set('user', res.user);

    const dom = this.add.dom(this.scale.width / 2, this.scale.height / 2).createFromHTML(renderHTML(res.stages, res.user));
    const root = dom.node;

    // Auto-scroll to first-unplayed
    const firstUnplayed = root.querySelector('.kb-card.current');
    if (firstUnplayed) {
      setTimeout(() => firstUnplayed.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
    }

    // Card click → BattleScene
    root.querySelectorAll('.kb-card').forEach(card => {
      card.addEventListener('click', () => {
        audio.play('click');
        const stageId = card.dataset.id;
        this.scene.start('Battle', { token: this.token, stage_id: stageId });
      });
    });

    // Leaderboard button
    root.querySelector('#kb-leader').addEventListener('click', () => {
      audio.play('click');
      showLeaderboard(this.token);
    });

    // Mute toggle
    const muteBtn = root.querySelector('#kb-mute');
    muteBtn.textContent = audio.isMuted() ? '🔇' : '🔊';
    muteBtn.addEventListener('click', () => {
      const muted = audio.toggleMute();
      muteBtn.textContent = muted ? '🔇' : '🔊';
    });

    // Logout
    root.querySelector('#kb-logout').addEventListener('click', () => {
      audio.play('click');
      storage.del('token');
      storage.del('user');
      this.scene.start('Auth');
    });

    // NEW banner click → scroll to newest
    const banner = root.querySelector('.kb-newbanner');
    if (banner) {
      banner.addEventListener('click', () => {
        const idx = banner.dataset.scroll;
        const target = root.querySelector(`.kb-card[data-idx="${idx}"]`);
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    }
  }
}
