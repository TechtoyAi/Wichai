import { api } from '../api.js';

export async function showLeaderboard(token) {
  let res;
  try { res = await api.leaderboard(token); }
  catch (e) { alert('โหลด leaderboard ล้มเหลว: ' + e.message); return; }

  const overlay = document.createElement('div');
  overlay.id = 'kb-leaderboard-overlay';
  overlay.innerHTML = `
    <div class="kb-lb-card">
      <div class="kb-lb-header">
        <h2>🏆 Leaderboard</h2>
        <button class="kb-lb-close">✕</button>
      </div>
      <div class="kb-lb-rank">อันดับคุณ: #${res.my_rank}</div>
      <div class="kb-lb-list">
        ${res.top.map(u => `
          <div class="kb-lb-row">
            <div class="kb-lb-pos">${u.pos}</div>
            <div class="kb-lb-name">${escapeHtml(u.name)}</div>
            <div class="kb-lb-meta">Lv.${u.level} · ${escapeHtml(u.rank)}</div>
            <div class="kb-lb-stars">⭐ ${u.total_stars}</div>
          </div>
        `).join('')}
      </div>
    </div>
    <style>
      #kb-leaderboard-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.7); display:flex; align-items:center; justify-content:center; z-index:9999; font-family:Sarabun; color:#fff; padding:16px; }
      .kb-lb-card { background:#1a1a2e; border-radius:12px; padding:16px; width:100%; max-width:420px; max-height:80vh; overflow-y:auto; }
      .kb-lb-header { display:flex; justify-content:space-between; align-items:center; padding-bottom:12px; border-bottom:1px solid #2d3748; margin-bottom:12px; }
      .kb-lb-header h2 { font-size:16px; color:#ffd700; }
      .kb-lb-close { background:#2d3748; border:none; color:#fff; width:30px; height:30px; border-radius:50%; cursor:pointer; }
      .kb-lb-rank { background:#e94560; color:#fff; padding:8px; border-radius:8px; text-align:center; margin-bottom:12px; }
      .kb-lb-row { display:flex; gap:10px; align-items:center; padding:8px; background:#16213e; border-radius:8px; margin-bottom:6px; }
      .kb-lb-pos { background:#ffd700; color:#1a1a2e; width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:12px; }
      .kb-lb-name { flex:1; font-weight:bold; font-size:14px; }
      .kb-lb-meta { font-size:11px; opacity:0.7; }
      .kb-lb-stars { color:#ffd700; font-weight:bold; }
    </style>
  `;

  overlay.querySelector('.kb-lb-close').addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
