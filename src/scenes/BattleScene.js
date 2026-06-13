import { api } from '../api.js';
import { createBattle } from '../state.js';
import { checkAnswer, isCritical } from '../scoring.js';
import * as audio from '../audio.js';
import { monsterSprite } from '../manifest.js';

const QUESTION_FORM = (q, idx, total, hearts, monsterHp, monsterMax) => `
<div id="kb-battle-ui">
  <div class="kb-hud">
    <div class="kb-hud-left">
      <div class="kb-q-counter">${idx + 1}/${total}</div>
      <div class="kb-hearts">${'❤️'.repeat(hearts)}${'🖤'.repeat(Math.max(0, 3 - hearts))}</div>
    </div>
    <div class="kb-timer" id="kb-timer">⏱ --</div>
  </div>
  <div class="kb-monster-hp">
    <div class="kb-monster-hp-label">Monster HP ${monsterHp}/${monsterMax}</div>
    <div class="kb-monster-hp-bar"><div class="kb-monster-hp-fill" style="width:${(monsterHp / monsterMax) * 100}%"></div></div>
  </div>
  <div class="kb-q-card">
    <div class="kb-q-text">${escapeHtml(q.question)}</div>
    <div class="kb-choices">
      ${Object.entries(q.options).map(([key, val]) => `
        <button class="kb-choice" data-choice="${escapeHtml(key)}">
          <span class="kb-choice-key">${escapeHtml(key)}</span>${escapeHtml(val)}
        </button>
      `).join('')}
    </div>
  </div>
</div>
<style>
  #kb-battle-ui { font-family:Sarabun; color:#fff; padding:8px; width:344px; box-sizing:border-box; }
  .kb-hud { display:flex; justify-content:space-between; padding:8px 12px; background:#16213e; border-radius:8px; margin-bottom:8px; font-size:13px; }
  .kb-hud-left { display:flex; gap:12px; align-items:center; }
  .kb-q-counter { background:#2d3748; padding:2px 8px; border-radius:4px; font-weight:bold; }
  .kb-timer { background:#e94560; padding:2px 10px; border-radius:12px; font-weight:bold; }
  .kb-monster-hp { background:#16213e; padding:8px 12px; border-radius:8px; margin-bottom:8px; }
  .kb-monster-hp-label { font-size:11px; opacity:0.8; margin-bottom:4px; text-align:center; }
  .kb-monster-hp-bar { background:#2d3748; height:6px; border-radius:3px; overflow:hidden; }
  .kb-monster-hp-fill { background:#e94560; height:100%; transition:width 0.4s; }
  .kb-q-card { background:#16213e; border-radius:8px; padding:12px; border-left:3px solid #ffd700; }
  .kb-q-text { font-size:14px; color:#ffd700; margin-bottom:10px; min-height:36px; }
  .kb-choices { display:grid; grid-template-columns:1fr 1fr; gap:6px; }
  .kb-choice { background:#2d3748; color:#fff; border:none; padding:10px; border-radius:6px; font-size:12px; text-align:left; cursor:pointer; font-family:Sarabun; }
  .kb-choice:hover { background:#3d4768; }
  .kb-choice:disabled { opacity:0.5; cursor:wait; }
  .kb-choice.correct { background:#22c55e; }
  .kb-choice.wrong { background:#e94560; }
  .kb-choice-key { display:inline-block; width:18px; height:18px; background:#1a1a2e; border-radius:50%; text-align:center; line-height:18px; font-size:10px; margin-right:6px; }
</style>
`;

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export default class BattleScene extends Phaser.Scene {
  constructor() { super('Battle'); }

  async create(data) {
    this.token = data.token;
    const stageId = data.stage_id;

    const loading = this.add.text(this.scale.width / 2, this.scale.height / 2, 'กำลังโหลดด่าน...', {
      fontFamily: 'Sarabun', fontSize: '14px', color: '#ffd700',
    }).setOrigin(0.5);

    let res;
    try { res = await api.stage(this.token, stageId); }
    catch (e) {
      loading.destroy();
      return this.scene.start('StageMap', { token: this.token });
    }
    loading.destroy();

    this.stage = res.stage;
    this.questions = res.questions;
    this.battle = createBattle({ questions: this.questions });
    this.monsterMax = this.questions.length;
    this.monsterHp = this.monsterMax;
    this.questionStart = 0;
    this.qGen = 0;          // per-question generation token (stops stale timer ticks)
    this.answered = false;  // reentrancy guard for the current question
    this.finishing = false; // guard against double-submit

    // Versus stage — hero left, monster right, top portion of screen
    const w = this.scale.width, h = this.scale.height;
    this.add.rectangle(w / 2, h * 0.20, w, h * 0.30, 0x16213e).setOrigin(0.5);
    this.hero = this.add.image(w * 0.25, h * 0.20, 'hero').setScale(2);
    this.monster = this.add.image(w * 0.75, h * 0.20, monsterSprite(this.stage.monster_name)).setScale(2);
    this.add.text(w / 2, h * 0.06, this.stage.title, {
      fontFamily: 'Sarabun', fontSize: '13px', color: '#ffd700',
    }).setOrigin(0.5);
    this.add.text(w / 2, h * 0.13, 'VS', {
      fontFamily: '"Press Start 2P"', fontSize: '10px', color: '#fff',
    }).setOrigin(0.5);

    // DOM container for HUD + question card (bottom portion of screen)
    this.domContainer = this.add.dom(w / 2, h * 0.68);

    this.nextQuestion();
  }

  nextQuestion() {
    if (this.finishing) return;
    if (this.battle.done()) return this.finish();
    this.answered = false;
    const gen = ++this.qGen;
    const q = this.battle.current();
    this.domContainer.createFromHTML(QUESTION_FORM(
      q, this.battle.index, this.questions.length, this.battle.hearts, this.monsterHp, this.monsterMax
    ));
    const root = this.domContainer.node;

    this.questionStart = performance.now();
    this.timeoutAt = this.questionStart + this.stage.sec_per_question * 1000;
    this.tickTimer(root, gen);

    root.querySelectorAll('.kb-choice').forEach(btn => {
      btn.addEventListener('click', () => this.onChoice(btn, root));
    });
  }

  tickTimer(root, gen) {
    // Bail if this tick belongs to a past question, or the question is already answered/over.
    if (gen !== this.qGen || this.answered || this.battle.done()) return;
    const remain = Math.max(0, Math.ceil((this.timeoutAt - performance.now()) / 1000));
    const el = root.querySelector('#kb-timer');
    if (el) el.textContent = `⏱ ${remain}s`;
    if (remain <= 0) {
      // Timeout = automatic wrong answer
      const fallback = root.querySelector('.kb-choice');
      if (fallback) this.onChoice(fallback, root, true);
      return;
    }
    this.tickTimerHandle = this.time.delayedCall(250, () => this.tickTimer(root, gen));
  }

  async onChoice(btn, root, isTimeout = false) {
    // Reentrancy guard: a real click and a timeout (or a second click) can race
    // before the async checkAnswer resolves — only the first wins.
    if (this.answered) return;
    this.answered = true;
    if (this.tickTimerHandle) this.tickTimerHandle.remove();
    root.querySelectorAll('.kb-choice').forEach(b => b.disabled = true);

    const choice = btn.dataset.choice;
    const q = this.battle.current();
    const elapsed = (performance.now() - this.questionStart) / 1000;
    const correct = !isTimeout && await checkAnswer(q.q_id, choice, q.answer_hash);
    const critical = correct && isCritical(elapsed, this.stage.sec_per_question);

    btn.classList.add(correct ? 'correct' : 'wrong');

    if (correct) {
      audio.play(critical ? 'critical' : 'correct');
      this.monsterHp = Math.max(0, this.monsterHp - 1);
      this.tweens.add({ targets: this.monster, x: this.monster.x + 10, duration: 80, yoyo: true, repeat: 3 });
      if (critical) this.tweens.add({ targets: this.hero, scale: 2.4, duration: 150, yoyo: true });
    } else {
      audio.play('wrong');
      this.tweens.add({ targets: this.hero, x: this.hero.x - 8, duration: 80, yoyo: true, repeat: 3 });
      audio.play('heart');
    }

    this.battle.answer(choice, correct, elapsed);
    this.time.delayedCall(1500, () => this.nextQuestion());
  }

  async finish() {
    if (this.finishing) return;
    this.finishing = true;
    const result = this.battle.result();
    this.domContainer.node.innerHTML = '<div style="color:#ffd700;text-align:center;padding:40px;font-family:Sarabun;">กำลังส่งผล...</div>';

    let submitRes;
    try {
      submitRes = await api.submit(this.token, this.stage.stage_id, result.choices, result.time_sec);
    } catch (e) {
      this.domContainer.node.innerHTML = `<div style="color:#e94560;text-align:center;padding:40px;">ส่งผลล้มเหลว: ${escapeHtml(e.message)}</div>`;
      this.time.delayedCall(2500, () => this.scene.start('StageMap', { token: this.token }));
      return;
    }

    audio.play(submitRes.result === 'win' ? 'win' : 'lose');
    if (submitRes.level_up) audio.play('levelup');

    this.scene.start('Result', { token: this.token, result: submitRes, stage: this.stage });
  }
}
