const sessions = new Map();

export function getSession(guildId) {
  return sessions.get(guildId);
}
export function setSession(guildId, data) {
  sessions.set(guildId, { ...(sessions.get(guildId) || {}), ...data });
}
export function deleteSession(guildId) {
  sessions.delete(guildId);
}
export function pushHistory(guildId, track) {
  const s = getSession(guildId) || {};
  const history = s.history || [];
  history.push(track);
  setSession(guildId, { history });
}
export function addQueue(guildId, track) {
  const s = getSession(guildId) || {};
  const queue = s.queue || [];
  queue.push(track);
  setSession(guildId, { queue });
}
export function shiftQueue(guildId) {
  const s = getSession(guildId) || {};
  const queue = s.queue || [];
  const next = queue.shift();
  setSession(guildId, { queue });
  return next;
}