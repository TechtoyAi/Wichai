import * as storage from './storage.js';

let sounds = {};
let muted = storage.get('muted') === true;

export function load(manifest) {
  // manifest: { name: 'assets/audio/file.mp3', ... }
  sounds = Object.fromEntries(Object.entries(manifest).map(([name, src]) => [
    name, new Howl({ src: [src], volume: 0.6 })
  ]));
}

export function play(name) {
  if (muted || !sounds[name]) return;
  sounds[name].play();
}

export function isMuted() { return muted; }

export function toggleMute() {
  muted = !muted;
  storage.set('muted', muted);
  return muted;
}
