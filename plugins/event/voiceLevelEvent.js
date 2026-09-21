import { handleVoiceStateUpdate } from '../../lib/voiceXpStore.js';

// Plugin ini gak dipanggil via prefix command, tapi ke-bind otomatis ke event Discord
// oleh bindEventPlugins() di index.js
export const event = 'voiceStateUpdate';

export const config = {
    name: 'voiceLevelTracker',
    isEnabled: true,
};

export async function handler(oldState, newState) {
    handleVoiceStateUpdate(oldState, newState);
}
