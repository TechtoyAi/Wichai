# Knowledge Battle — Frontend

Phaser.js game ที่เชื่อมกับ GAS backend (ดู `../README.md` สำหรับ backend).

## เล่นได้ที่
https://techtoyai.github.io/Wichai/  *(live — deploy แล้ว 2026-06-13)*

## Dev local
```bash
python -m http.server 8000
# เปิด http://localhost:8000
```
ต้องเสิร์ฟผ่าน http (ไม่ใช่ `file://`) เพราะใช้ ES modules.

## Test
```bash
bash tests/run.sh
```
รัน unit tests (api/scoring/state) + `static-check.mjs` (syntax + import resolution ของทุกไฟล์ใน `src/`). Scenes เป็น browser-only (อ้าง global `Phaser`/`Howl`) จึง verify ด้วย static check ไม่ใช่ runtime.

## Stack
- Phaser 3.80.1 (CDN)
- Howler.js 2.2.4 (CDN) — SFX
- Vanilla ES modules — ไม่มี bundler

## โครงสร้าง src/
```
src/
├── main.js              ← Phaser config + ลงทะเบียน 5 scenes
├── config.js            ← GAS_URL, สี, ขนาดจอ
├── api.js               ← เรียก GAS (text/plain เลี่ยง CORS preflight)
├── scoring.js           ← hash เฉลย + critical-hit
├── state.js             ← battle state machine
├── storage.js           ← localStorage (prefix kb:)
├── audio.js             ← Howler manager + mute persist
├── manifest.js          ← sprite/SFX paths + monsterSprite()
└── scenes/
    ├── BootScene.js         ← preload + auto-resume + mobile audio unlock
    ├── AuthScene.js         ← login/register
    ├── StageMapScene.js     ← การ์ดด่าน + leaderboard + mute toggle
    ├── LeaderboardModal.js
    ├── BattleScene.js       ← core loop (timer/❤️/HP/critical)
    └── ResultScene.js       ← cinematic + progression hint
```

## Deploy → GitHub Pages
Host = repo `TechtoyAi/Wichai` (public, Pages เปิดอยู่, deploy key เขียนได้). อัปเดตเกม: ดูขั้นตอนใน `../README.md` หัวข้อ "Deploy Frontend".
