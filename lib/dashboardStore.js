import { EventEmitter } from 'events';

export const dashboardEvents = new EventEmitter();
const MAX_LOG = 200;
const replyLog = [];
const dmConversations = new Map();

export function logReply(entry) {
    replyLog.unshift(entry);
    if (replyLog.length > MAX_LOG) replyLog.pop();
    dashboardEvents.emit('newReply', entry);
}
export function getReplies() {
    return replyLog;
}

export function logDM(userId, tag, avatar, message) {
    if (!dmConversations.has(userId)) dmConversations.set(userId, { userId, tag, avatar, messages: [] });
    const convo = dmConversations.get(userId);
    convo.tag = tag;
    convo.avatar = avatar;
    convo.messages.push(message);
    if (convo.messages.length > MAX_LOG) convo.messages.shift();
    dashboardEvents.emit('newDM', { userId, tag, avatar, message });
}
export function getDMList() {
    return [...dmConversations.values()]
        .map(({ userId, tag, avatar, messages }) => ({ userId, tag, avatar, lastMessage: messages[messages.length - 1] || null }))
        .sort((a, b) => (b.lastMessage?.timestamp || 0) - (a.lastMessage?.timestamp || 0));
}
export function getDMHistory(userId) {
    return dmConversations.get(userId)?.messages || [];
}