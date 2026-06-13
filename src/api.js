import { GAS_URL } from './config.js';

/**
 * POST JSON to GAS Web App.
 * Uses Content-Type: text/plain to avoid CORS preflight (GAS reads e.postData.contents regardless).
 * Browser auto-follows 302 → GET to user_content_key where response JSON is stored.
 */
export async function call(body, baseUrl = GAS_URL) {
  const res = await fetch(baseUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(body),
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || 'unknown_error');
  return json;
}

export const api = {
  register: (name, pass) => call({ action: 'register', name, pass }),
  login: (name, pass) => call({ action: 'login', name, pass }),
  stages: (token) => call({ action: 'stages', token }),
  stage: (token, stage_id) => call({ action: 'stage', token, stage_id }),
  submit: (token, stage_id, choices, time_sec) => call({ action: 'submit', token, stage_id, choices, time_sec }),
  leaderboard: (token) => call({ action: 'leaderboard', token }),
};
