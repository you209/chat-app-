import { storage } from './storage';

const DEVICE_TOKEN_KEY = 'gentle.deviceToken';
const SESSION_TOKEN_KEY = 'gentle.sessionToken';

let sessionToken = null;

export async function getDeviceToken() {
  return storage.get(DEVICE_TOKEN_KEY);
}

export async function setDeviceToken(token) {
  await storage.set(DEVICE_TOKEN_KEY, token);
}

export async function setSessionToken(token) {
  sessionToken = token;
  await storage.set(SESSION_TOKEN_KEY, token);
}

export async function loadSessionToken() {
  sessionToken = await storage.get(SESSION_TOKEN_KEY);
  return sessionToken;
}

export function getSessionToken() {
  return sessionToken;
}

async function request(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (sessionToken) headers.Authorization = `Bearer ${sessionToken}`;

  const res = await fetch(`/api${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'request failed');
  return data;
}

export const api = {
  register: (payload) => request('/auth/register', { method: 'POST', body: payload }),
  session: (deviceToken) => request('/auth/session', { method: 'POST', body: { deviceToken } }),
  topics: () => request('/topics'),
  supportOptions: () => request('/support-options'),
  me: () => request('/me'),
  updateMe: (payload) => request('/me', { method: 'PATCH', body: payload }),
  checkInMood: (mood) => request('/mood', { method: 'POST', body: { mood } }),
  runMatching: () => request('/matching/run', { method: 'POST' }),
  matches: () => request('/matches'),
  wave: (matchId) => request(`/matches/${matchId}/wave`, { method: 'POST' }),
  pass: (matchId) => request(`/matches/${matchId}/pass`, { method: 'POST' }),
  messages: (matchId) => request(`/matches/${matchId}/messages`),
  connect: (matchId) => request(`/matches/${matchId}/connect`, { method: 'POST' }),
  reveal: (matchId, payload) => request(`/matches/${matchId}/reveal`, { method: 'POST', body: payload }),
  report: (payload) => request('/reports', { method: 'POST', body: payload })
};
