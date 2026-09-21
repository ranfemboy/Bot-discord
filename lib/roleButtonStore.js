import { ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField } from 'discord.js';

// 🎭 Role button itu stateless — role ID-nya langsung ditempel di customId,
// jadi gak perlu Map/JSON kayak confessStore atau warnStore. Tinggal baca pas diklik.
const PREFIX = 'rolebtn_';

export function buildRoleButtonRows(roles) {
    // Discord max 5 tombol per row, 5 row per message -> maksimal 25 tombol
    const rows = [];
    for (let i = 0; i < roles.length; i += 5) {
        const chunk = roles.slice(i, i + 5);
        const row = new ActionRowBuilder().addComponents(
            chunk.map((r) => {
                const btn = new ButtonBuilder()
                    .setCustomId(`${PREFIX}${r.id}`)
                    .setLabel(r.label.slice(0, 80))
                    .setStyle(ButtonStyle.Secondary);
                if (r.emoji) {
                    try {
                        btn.setEmoji(r.emoji);
                    } catch {
                        // Emoji-nya gak valid, biarin tombol tanpa emoji drpd bikin error
                    }
                }
                return btn;
            })
        );
        rows.push(row);
    }
    return rows;
}

// 🔘 Dipanggil dari handler/interactionHandler.js tiap ada tombol rolebtn_
export async function handleRoleButtonClick(interaction) {
    const roleId = interaction.customId.replace(PREFIX, '');

    try {
        const role = interaction.guild.roles.cache.get(roleId);
        if (!role) {
            return interaction.reply({ content: '❌ Role ini udah gak ada / kehapus.', ephemeral: true });
        }

        const me = interaction.guild.members.me;
        if (!me?.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
            return interaction.reply({ content: '❌ Bot gak punya permission **Manage Roles**!', ephemeral: true });
        }

        if (role.position >= me.roles.highest.position) {
            return interaction.reply({
                content: `❌ Role **${role.name}** posisinya lebih tinggi/sejajar sama role bot, jadi gak bisa di-assign. Minta staff pindahin role bot ke atas.`,
                ephemeral: true,
            });
        }

        const member = interaction.member;
        const hasRole = member.roles.cache.has(roleId);

        if (hasRole) {
            await member.roles.remove(roleId);
            await interaction.reply({ content: `➖ Role **${role.name}** dilepas!`, ephemeral: true });
        } else {
            await member.roles.add(roleId);
            await interaction.reply({ content: `✅ Role **${role.name}** ditambahin!`, ephemeral: true });
        }
    } catch (e) {
        console.error('RoleButton Error:', e);
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ content: `❌ Error: ${e.message}`, ephemeral: true }).catch(() => {});
        }
    }
}
