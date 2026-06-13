export const SPRITES = {
  hero: 'assets/sprites/hero.png',
  'monster-slime': 'assets/sprites/monster-slime.png',
  'monster-goblin': 'assets/sprites/monster-goblin.png',
  'monster-orc': 'assets/sprites/monster-orc.png',
  'monster-skeleton': 'assets/sprites/monster-skeleton.png',
};

/** SFX manifest. Kenney CC0 .ogg files (Howler supports .ogg natively). */
export const SFX = {
  correct: 'assets/audio/correct.ogg',
  wrong: 'assets/audio/wrong.ogg',
  win: 'assets/audio/win.ogg',
  critical: 'assets/audio/critical.ogg',
  levelup: 'assets/audio/levelup.ogg',
  click: 'assets/audio/click.ogg',
  heart: 'assets/audio/heart.ogg',
  lose: 'assets/audio/lose.ogg',
};

/** Monster name → sprite key (used by BattleScene/StageMap) */
export function monsterSprite(monsterName) {
  const name = String(monsterName || '').toLowerCase();
  if (name.includes('slime')) return 'monster-slime';
  if (name.includes('goblin')) return 'monster-goblin';
  if (name.includes('orc')) return 'monster-orc';
  if (name.includes('skeleton')) return 'monster-skeleton';
  return 'monster-slime';
}
