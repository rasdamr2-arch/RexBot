import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ChannelType,
} from "discord.js";

import { db } from "../database/db";

const ticket = {
  data: new SlashCommandBuilder()
    .setName("ticket")
    .setDescription("إدارة نظام التذاكر")

    .addSubcommand(sub =>
      sub
        .setName("setup")
        .setDescription("إنشاء لوحة التذاكر")
    )

    .addSubcommand(sub =>
      sub
        .setName("close")
        .setDescription("إغلاق التذكرة الحالية")
    )

    .setDefaultMemberPermissions(
      PermissionFlagsBits.ManageGuild
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return;

    const subcommand =
      interaction.options.getSubcommand();

    // ==================== SETUP ====================

    if (subcommand === "setup") {
      const guild = interaction.guild;

      let category = guild.channels.cache.find(
        channel =>
          channel.type === ChannelType.GuildCategory &&
          channel.name === "🎫 Tickets"
      );

      if (!category) {
        category = await guild.channels.create({
          name: "🎫 Tickets",
          type: ChannelType.GuildCategory,
        });
      }

      await db.set(
        `ticket.${guild.id}.category`,
        category.id
      );

      const embed = new EmbedBuilder()
        .setTitle("🎫 نظام التذاكر")
        .setDescription(
          "تحتاج مساعدة؟\n\n" +
          "اضغط على الزر أدناه لفتح تذكرة خاصة مع فريق الإدارة."
        )
        .setFooter({
          text: "RexBot • Ticket System",
        });

      const button = new ButtonBuilder()
        .setCustomId("ticket_create")
        .setLabel("فتح تذكرة")
        .setEmoji("🎫")
        .setStyle(ButtonStyle.Primary);

      const row =
        new ActionRowBuilder<ButtonBuilder>()
          .addComponents(button);

      await interaction.reply({
        embeds: [embed],
        components: [row],
      });

      return;
    }

    // ==================== CLOSE COMMAND ====================

    if (subcommand === "close") {
      const channel = interaction.channel;

      if (
        !channel ||
        channel.type !== ChannelType.GuildText
      ) {
        return interaction.reply({
          content: "❌ هذا الأمر يستخدم داخل التذكرة فقط.",
          ephemeral: true,
        });
      }

      if (!channel.name.startsWith("ticket-")) {
        return interaction.reply({
          content: "❌ هذه القناة ليست تذكرة.",
          ephemeral: true,
        });
      }

      await interaction.reply(
        "🔒 تم إغلاق التذكرة. سيتم حذفها خلال 5 ثوانٍ."
      );

      setTimeout(async () => {
        await channel.delete().catch(() => {});
      }, 5000);

      return;
    }
  },
};

export default ticket;
