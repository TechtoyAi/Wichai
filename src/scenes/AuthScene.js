import { api } from '../api.js';
import * as storage from '../storage.js';
import * as audio from '../audio.js';

const FORM_HTML = `
<div id="kb-auth" style="font-family:Sarabun,sans-serif;color:#fff;padding:20px;width:300px;">
  <h1 style="font-family:'Press Start 2P';font-size:14px;color:#ffd700;text-align:center;margin-bottom:20px;">KNOWLEDGE BATTLE</h1>
  <div style="display:flex;gap:8px;margin-bottom:16px;">
    <button data-tab="login" class="kb-tab active">เข้าสู่ระบบ</button>
    <button data-tab="register" class="kb-tab">สมัคร</button>
  </div>
  <input id="kb-name" placeholder="ชื่อผู้เล่น (3-20)" autocomplete="username"
         style="width:100%;padding:10px;margin-bottom:8px;border-radius:6px;border:1px solid #2d3748;background:#16213e;color:#fff;box-sizing:border-box;">
  <input id="kb-pass" type="password" placeholder="รหัส (อย่างน้อย 4)" autocomplete="current-password"
         style="width:100%;padding:10px;margin-bottom:12px;border-radius:6px;border:1px solid #2d3748;background:#16213e;color:#fff;box-sizing:border-box;">
  <button id="kb-submit"
          style="width:100%;padding:12px;border-radius:6px;background:#e94560;color:#fff;border:none;font-weight:bold;cursor:pointer;">
    เข้าสู่ระบบ
  </button>
  <div id="kb-msg" style="margin-top:12px;text-align:center;font-size:13px;color:#ffd700;min-height:20px;"></div>
</div>
<style>
.kb-tab { flex:1;padding:8px;border-radius:6px;background:#2d3748;color:#fff;border:none;cursor:pointer;font-family:Sarabun; }
.kb-tab.active { background:#ffd700;color:#1a1a2e;font-weight:bold; }
</style>
`;

export default class AuthScene extends Phaser.Scene {
  constructor() { super('Auth'); }

  create() {
    this.mode = 'login';
    const dom = this.add.dom(this.scale.width / 2, this.scale.height / 2).createFromHTML(FORM_HTML);
    this.dom = dom;
    const root = dom.node;

    root.querySelectorAll('.kb-tab').forEach(btn => {
      btn.addEventListener('click', () => this.setMode(btn.dataset.tab));
    });
    root.querySelector('#kb-submit').addEventListener('click', () => this.submit());
    root.querySelector('#kb-pass').addEventListener('keydown', e => { if (e.key === 'Enter') this.submit(); });
  }

  setMode(mode) {
    this.mode = mode;
    const root = this.dom.node;
    root.querySelectorAll('.kb-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === mode));
    root.querySelector('#kb-submit').textContent = mode === 'login' ? 'เข้าสู่ระบบ' : 'สมัคร';
    this.msg('');
  }

  msg(text, color = '#ffd700') {
    const el = this.dom.node.querySelector('#kb-msg');
    el.textContent = text;
    el.style.color = color;
  }

  async submit() {
    audio.play('click');
    const root = this.dom.node;
    const name = root.querySelector('#kb-name').value.trim();
    const pass = root.querySelector('#kb-pass').value;
    if (!name || !pass) return this.msg('กรอกข้อมูลให้ครบ', '#e94560');
    this.msg('กำลังโหลด...', '#ffd700');
    try {
      if (this.mode === 'register') {
        await api.register(name, pass);
        this.msg('สมัครสำเร็จ! รอ Admin อนุมัติ', '#ffd700');
      } else {
        const r = await api.login(name, pass);
        storage.set('token', r.token);
        storage.set('user', r.user);
        this.scene.start('StageMap', { token: r.token, user: r.user });
      }
    } catch (e) {
      this.msg(String(e.message || e), '#e94560');
    }
  }
}
