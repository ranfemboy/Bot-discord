import { handleConfessButton, handleConfessRejectModalSubmit, handleConfessSubmitOpen, handleConfessSubmitModalSubmit } from '../lib/confessStore.js';
import { handleConfessConfigButton, handleConfessConfigSelect } from '../lib/confessConfigStore.js';
import { handleRoleButtonClick } from '../lib/roleButtonStore.js';
import { handleGiveawayClaim } from '../lib/giveawayStore.js';
import { handleGiveawayAmClaim } from '../lib/giveawayAmStore.js';
import { handleIqcButton } from '../lib/iqcStore.js';
import { handleHuntButton } from '../lib/huntStore.js';
import { handleEksplorButton } from '../lib/eksplorStore.js';
import { handleDuelButton } from '../lib/duelStore.js';
import { handleFamilyButton } from '../lib/familyStore.js';
import { handleSlashCommand } from './slashCommandHandler.js';
import { handleSayWelcomeButton } from '../lib/welcomeButtonStore.js';
import {
    handleReportButton,
    handleReportModalSubmit,
    handleReportRespondButton,
    handleReportRespondModalSubmit,
} from '../lib/reportStore.js';
import {
    handleKomikuSearchSelect,
    handleKomikuSearchPage,
    handleKomikuChapterSelect,
    handleKomikuChapterPage,
} from '../plugins/anime/komiku.js';
import { handleMenuCategorySelect } from '../plugins/general/menu.js';
import { handlePinterestPage } from '../plugins/download/pinterest.js';
import { handleJoinButton as handleWerewolfJoin, handleStartButton as handleWerewolfStart } from '../plugins/game/werewolf.js';
import {
    handleNightAction as handleWerewolfNightAction,
    handleVote as handleWerewolfVote,
    handleSheriffTargetSelect as handleWerewolfSheriffTarget,
    handleSheriffGuess as handleWerewolfSheriffGuess,
    handleWitchPoison as handleWerewolfWitchPoison,
    handleWitchSkip as handleWerewolfWitchSkip,
    handleWitchHeal as handleWerewolfWitchHeal,
    handleGhostClueButton as handleWerewolfGhostClueButton,
    handleGhostModalSubmit as handleWerewolfGhostModalSubmit,
} from '../lib/werewolfStore.js';
import { handleTiktokAudioButton } from '../plugins/download/tiktok.js';
import { handleGachaSkip } from '../plugins/gacha/gachawaifu.js';
import { handleGachaHusbuSkip } from '../plugins/gacha/gachahusbu.js';
import { handlePickButton as handleTebakBombPick, handleCashOutButton as handleTebakBombCashOut } from '../lib/tebakBombStore.js';
import { handlePickButton as handleTTTPick, handleDifficultyButton as handleTTTDifficulty } from '../lib/tictactoeStore.js';
import { interaction as handleSendMessageInteraction } from '../plugins/owner/sendmessage.js';
import { handleMusicButton } from '../lib/musicButtons.js';

// 🔘🧾📋 Handler utama untuk semua interaction Discord (dipanggil dari index.js lewat event interactionCreate)
export async function handleInteraction(interaction, { client, settings }) {
    try {
        // ⌨️ Slash command
        if (interaction.isChatInputCommand()) {
            return await handleSlashCommand(interaction, { client, settings });
        }

        // 🔘 Tombol
        if (interaction.isButton()) {
            // 📡 Sendmessage/Broadcast: pilih server (step 1) & tombol fitur di pesan broadcast (step 3)
            if (interaction.customId.startsWith('sm_')) {
                return await handleSendMessageInteraction(interaction, { client, settings });
            }
            // 💌 Confess: approve/tolak pesan confess dari log channel
            if (interaction.customId.startsWith('confessApprove_') || interaction.customId.startsWith('confessReject_')) {
                return await handleConfessButton(interaction);
            }
            // 💌 Confess: tombol "Submit Confession" di pesan confess publik -> buka modal submit confession BARU
            if (interaction.customId === 'confessSubmitOpen') {
                return await handleConfessSubmitOpen(interaction);
            }
            // 💮 Confess Setup: klik tombol "Setting Approval/Send Channels" di pesan .confession
            if (interaction.customId.startsWith('confessCfgApproval_') || interaction.customId.startsWith('confessCfgSend_')) {
                return await handleConfessConfigButton(interaction);
            }
            // 🎭 Role Button: klik tombol buat toggle self-role
            if (interaction.customId.startsWith('rolebtn_')) {
                return await handleRoleButtonClick(interaction);
            }
            if (interaction.customId.startsWith('giveawayam_')) {
                return await handleGiveawayAmClaim(interaction, { settings });
            }
            if (interaction.customId.startsWith('giveaway_')) {
                return await handleGiveawayClaim(interaction);
            }
            if (interaction.customId.startsWith('iqc_')) {
                return await handleIqcButton(interaction);
            }
            if (interaction.customId.startsWith('hunt_')) {
                return await handleHuntButton(interaction);
            }
            if (interaction.customId.startsWith('eksplor_')) {
                return await handleEksplorButton(interaction);
            }
            if (interaction.customId.startsWith('duel_')) {
                return await handleDuelButton(interaction);
            }
            if (interaction.customId.startsWith('family_')) {
                return await handleFamilyButton(interaction);
            }
            if (interaction.customId.startsWith('saywelcome_')) {
                return await handleSayWelcomeButton(interaction);
            }
            if (interaction.customId.startsWith('report_')) {
                return await handleReportButton(interaction);
            }
            if (interaction.customId.startsWith('request_')) {
                return await handleReportButton(interaction);
            }
            if (interaction.customId.startsWith('reportRespond_')) {
                return await handleReportRespondButton(interaction, { settings });
            }
            if (interaction.customId.startsWith('komikuSearchPage_')) {
                return await handleKomikuSearchPage(interaction);
            }
            if (interaction.customId.startsWith('komikuChapterPage_')) {
                return await handleKomikuChapterPage(interaction);
            }
            if (interaction.customId.startsWith('pinterestPage_')) {
                return await handlePinterestPage(interaction);
            }
            // 🐺 Werewolf: lobby (gabung/mulai), aksi malam (DM), dan vote (siang)
            if (interaction.customId.startsWith('wwjoin_')) {
                return await handleWerewolfJoin(interaction, { settings });
            }
            if (interaction.customId.startsWith('wwstart_')) {
                return await handleWerewolfStart(interaction, { settings });
            }
            if (interaction.customId.startsWith('wwact_')) {
                const [, channelId, targetNumber] = interaction.customId.split('_');
                return await handleWerewolfNightAction(interaction, channelId, parseInt(targetNumber, 10));
            }
            if (interaction.customId.startsWith('wwvote_')) {
                const [, channelId, targetNumber] = interaction.customId.split('_');
                return await handleWerewolfVote(interaction, channelId, parseInt(targetNumber, 10));
            }
            // 👼 Werewolf: Witch racun / simpan racun / pakai ramuan hidup
            if (interaction.customId.startsWith('wwwitchpoison_')) {
                const [, channelId, targetNumber] = interaction.customId.split('_');
                return await handleWerewolfWitchPoison(interaction, channelId, parseInt(targetNumber, 10));
            }
            if (interaction.customId.startsWith('wwwitchskip_')) {
                const [, channelId] = interaction.customId.split('_');
                return await handleWerewolfWitchSkip(interaction, channelId);
            }
            if (interaction.customId.startsWith('wwwitchheal_')) {
                const [, channelId, decision] = interaction.customId.split('_');
                return await handleWerewolfWitchHeal(interaction, channelId, decision);
            }
            // 👻 Werewolf: Ghost kirim clue anonim (munculin modal)
            if (interaction.customId.startsWith('wwghostclue_')) {
                const [, channelId] = interaction.customId.split('_');
                return await handleWerewolfGhostClueButton(interaction, channelId);
            }
            // 🕵️ Werewolf: Sheriff pilih target lalu tebak Werewolf/bukan (3 hati)
            if (interaction.customId.startsWith('wwsheriffguess_')) {
                const [, channelId, targetNumber, guess] = interaction.customId.split('_');
                return await handleWerewolfSheriffGuess(interaction, channelId, parseInt(targetNumber, 10), guess);
            }
            if (interaction.customId.startsWith('wwsheriff_')) {
                const [, channelId, targetNumber] = interaction.customId.split('_');
                return await handleWerewolfSheriffTarget(interaction, channelId, parseInt(targetNumber, 10));
            }
            // 🎵 TikTok: tombol "Unduh Audionya"
            if (interaction.customId.startsWith('ttaudio_')) {
                return await handleTiktokAudioButton(interaction);
            }
            // 💒 Waifu: tombol "Skip ⏩" di .gachawaifu
            if (interaction.customId.startsWith('gachaSkip_')) {
                return await handleGachaSkip(interaction);
            }
            // 🤵 Husbu: tombol "Skip ⏩" di .gachahusbu
            if (interaction.customId.startsWith('gachaHusbuSkip_')) {
                return await handleGachaHusbuSkip(interaction);
            }
            // 💣 Tebak Bomb: pilih kotak & cash out
            if (interaction.customId.startsWith('tebakbomb_pick_')) {
                return await handleTebakBombPick(interaction);
            }
            if (interaction.customId.startsWith('tebakbomb_cashout_')) {
                return await handleTebakBombCashOut(interaction);
            }
            // ❌⭕ Tic Tac Toe: pilih kotak & pilih tingkat kesulitan bot
            if (interaction.customId.startsWith('tictactoe_pick_')) {
                return await handleTTTPick(interaction);
            }
            if (interaction.customId.startsWith('tictactoe_startbot_')) {
                return await handleTTTDifficulty(interaction);
            }
            // 🎵 Music: tombol Play/Pause, Skip, Return, Volume, Off
            if (interaction.customId.startsWith('music_')) {
                return await handleMusicButton(interaction);
            }
            return;
        }

        // 📋 Select Menu (dropdown)
        if (interaction.isStringSelectMenu()) {
            // 📡 Sendmessage/Broadcast: dropdown pilih channel (step 2)
            if (interaction.customId.startsWith('sm_')) {
                return await handleSendMessageInteraction(interaction, { client, settings });
            }
            if (interaction.customId.startsWith('komikuSearchSelect_')) {
                return await handleKomikuSearchSelect(interaction);
            }
            if (interaction.customId.startsWith('komikuChapterSelect_')) {
                return await handleKomikuChapterSelect(interaction);
            }
            if (interaction.customId.startsWith('menuCategorySelect_')) {
                return await handleMenuCategorySelect(interaction, { settings });
            }
            return;
        }

        // 📺 Channel Select Menu
        if (interaction.isChannelSelectMenu()) {
            // 💮 Confess Setup: admin milih channel approval / channel kirim confess
            if (interaction.customId.startsWith('confessCfgApprovalSelect_') || interaction.customId.startsWith('confessCfgSendSelect_')) {
                return await handleConfessConfigSelect(interaction);
            }
            return;
        }

        // 📝 Modal (form isian)
        if (interaction.isModalSubmit()) {
            if (interaction.customId.startsWith('reportModal_')) {
                return await handleReportModalSubmit(interaction, { client, settings });
            }
            if (interaction.customId.startsWith('requestModal_')) {
                return await handleReportModalSubmit(interaction, { client, settings });
            }
            if (interaction.customId.startsWith('reportRespondModal_')) {
                return await handleReportRespondModalSubmit(interaction, { client });
            }
            // 💮 Confess: staff submit modal alasan tolak
            if (interaction.customId.startsWith('confessRejectModal_')) {
                return await handleConfessRejectModalSubmit(interaction);
            }
            // 💌 Confess: user submit modal "Submit a Confession" (confession baru dari tombol)
            if (interaction.customId === 'confessSubmitModal') {
                return await handleConfessSubmitModalSubmit(interaction);
            }
            // 👻 Werewolf: Ghost submit isi clue anonimnya
            if (interaction.customId.startsWith('wwghostModal_')) {
                const [, channelId] = interaction.customId.split('_');
                return await handleWerewolfGhostModalSubmit(interaction, channelId);
            }
            return;
        }
    } catch (error) {
        console.error('Interaction Error:', error);
    }
}