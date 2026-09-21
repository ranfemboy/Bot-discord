import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

// Bikin baris tombol hijau "Say welcome 👋" yang nempel ID member baru
export function buildSayWelcomeRow(memberId) {
    const button = new ButtonBuilder()
        .setCustomId(`saywelcome_${memberId}`)
        .setLabel('Say welcome 👋')
        .setStyle(ButtonStyle.Success); // hijau

    return new ActionRowBuilder().addComponents(button);
}

// Dipanggil saat ada yang klik tombolnya
export async function handleSayWelcomeButton(interaction) {
    try {
        const newMemberId = interaction.customId.split('_')[1];

        if (interaction.user.id === newMemberId) {
            return interaction.reply({
                content: '❌ Kamu tidak bisa menyapa diri sendiri!',
                ephemeral: true
            });
        }

        await interaction.reply({
            content: `👋 <@${interaction.user.id}> menyapa <@${newMemberId}>: **Selamat datang di server!** 🎉`
        });
    } catch (error) {
        console.error('SayWelcome Button Error:', error);
    }
}