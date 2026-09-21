import { getSession, setSession } from './musicStore.js';
import { nowPlayingEmbed, musicButtons } from './musicEmbed.js';
import { playTrack } from '../plugins/music/play.js';

export async function handleMusicButton(interaction) {
    const session = getSession(interaction.guild.id);
    if (!session?.player) {
        return interaction.reply({ content: '❌ Gak ada lagu aktif.', ephemeral: true });
    }

    switch (interaction.customId) {
        case 'music_toggle': {
            if (session.paused) {
                session.player.unpause();
                setSession(interaction.guild.id, { paused: false });
            } else {
                session.player.pause();
                setSession(interaction.guild.id, { paused: true });
            }
            await interaction.deferUpdate();
            break;
        }
        case 'music_skip': {
            session.player.stop(); // idle handler di play.js otomatis lanjut ke next
            await interaction.reply({ content: '⏭️ Skip.', ephemeral: true });
            return;
        }
        case 'music_return': {
            const history = session.history || [];
            const last = history.pop();
            if (!last) return interaction.reply({ content: '❌ Gak ada history lagu.', ephemeral: true });
            setSession(interaction.guild.id, { history });
            await interaction.deferUpdate();
            await playTrack(interaction.guild, interaction.channel, last, interaction.user.username);
            return;
        }
        case 'music_volup':
        case 'music_voldown': {
            const delta = interaction.customId === 'music_volup' ? 10 : -10;
            const newVol = Math.max(0, Math.min(100, (session.volume || 100) + delta));
            session.resource?.volume?.setVolume(newVol / 100);
            setSession(interaction.guild.id, { volume: newVol });
            await interaction.deferUpdate();
            break;
        }
        case 'music_off': {
            session.connection?.destroy();
            const { deleteSession } = await import('./musicStore.js');
            deleteSession(interaction.guild.id);
            await interaction.reply({ content: '⏹️ Bot keluar dari voice channel.', ephemeral: true });
            return;
        }
    }

    // update embed setelah toggle/volume
    const updatedSession = getSession(interaction.guild.id);
    if (updatedSession?.current && updatedSession?.nowPlayingMessage) {
        const embed = nowPlayingEmbed({
            title: updatedSession.current.title,
            thumbnail: `https://i.ytimg.com/vi/${updatedSession.current.id}/hqdefault.jpg`,
            duration: updatedSession.current.duration || 0,
            volume: updatedSession.volume || 100,
            paused: updatedSession.paused || false,
        });
        await updatedSession.nowPlayingMessage.edit({ embeds: [embed], components: musicButtons(updatedSession.paused) }).catch(() => {});
    }
}