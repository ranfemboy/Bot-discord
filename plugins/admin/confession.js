import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

const pluginConfig = {
    name: 'confession',
    alias: ['setupconfess', 'confesssetup'],
    category: 'admin',
    description: 'Setup fitur confess: atur channel approval & channel pengiriman (khusus Administrator)',
    usage: '.confession',
    example: '.confession',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true,
};

async function handler(m, { settings }) {
    if (!m.member.permissions.has('Administrator')) {
        return m.reply('❌ Kamu butuh permission **Administrator** buat pakai command ini.');
    }

    const saweriaLine = settings?.saweriaLink
        ? `\n\n💖 Suka sama bot ini? Boleh banget dukung lewat [Saweria](${settings.saweriaLink}) yaa~ makasih banyak! 🌸`
        : '';

    const embed = new EmbedBuilder()
        .setColor('#FFC0DA')
        .setDescription(
            `Hai ${m.author} 👋, kamu mau menggunakan fitur confession yah? Mohon untuk setting dulu yah di bawah ini~ 🌸\n\n` +
            `H-hmph, bukan berarti aku seneng bisa bantuin kamu setup ya... c-cuma kebetulan lagi mood baik aja hari ini! (｡>﹏<｡) 💮✨` +
            saweriaLine
        )
        .setFooter({ text: 'Fish • Confession System' });

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`confessCfgApproval_${m.guild.id}`)
            .setLabel('Setting Approval Channels')
            .setEmoji('✅')
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId(`confessCfgSend_${m.guild.id}`)
            .setLabel('Setting Send Messenger Channels')
            .setEmoji('📮')
            .setStyle(ButtonStyle.Secondary)
    );

    return m.reply({ embeds: [embed], components: [row] });
}

export { pluginConfig as config, handler };
