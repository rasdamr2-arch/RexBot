import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
} from "discord.js";

import { db } from "../database/db";

const welcome = {
  data: new SlashCommandBuilder()
    .setName("welcome")
    .setDescription("إدارة نظام الترحيب")
    .addSubcommand(sub =>
      sub
        .setName("setup")
        .setDescription("تحديد قناة الترحيب")
        .addChannelOption(option =>
          option
            .setName("channel")
            .setDescription("قناة إرسال رسائل الترحيب")
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName("message")
        .setDescription("تحديد رسالة الترحيب")
        .addStringOption(option =>
          option
            .setName("text")
            .setDescription("رسالة الترحيب التي تريدها")
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName("on")
        .setDescription("تشغيل الترحيب")
    )
    .addSubcommand(sub =>
      sub
        .setName("off")
        .setDescription("إيقاف الترحيب")
    )
    .addSubcommand(sub =>
      sub
        .setName("image")
        .setDescription("إظهار صورة العضو مع الترحيب")
        .addStringOption(option =>
          option
            .setName("status")
            .setDescription("تشغيل أو إيقاف صورة العضو")
            .setRequired(true)
            .addChoices(
              { name: "تشغيل", value: "on" },
              { name: "إيقاف", value: "off" }
            )
        )
    )
    .addSubcommand(sub =>
      sub
        .setName("show")
        .setDescription("عرض إعدادات الترحيب الحالية")
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return;

    const guildId = interaction.guild.id;
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "setup") {
      const channel = interaction.options.getChannel("channel", true);

      await db.set(`welcome.${guildId}.channel`, channel.id);

      await interaction.reply({
        content:
          `✅ تم تحديد قناة الترحيب: <#${channel.id}>\n\n` +
          `استخدم \`/welcome message\` لتحديد الرسالة.\n` +
          `استخدم \`/welcome image\` لتحديد ظهور صورة العضو.\n` +
          `واستخدم \`/welcome on\` لتشغيل النظام.`,
        ephemeral: true,
      });

      return;
    }

    if (subcommand === "message") {
      const message = interaction.options.getString("text", true);

      await db.set(`welcome.${guildId}.message`, message);

      await interaction.reply({
        content:
          `✅ تم حفظ رسالة الترحيب.\n\n` +
          `**المتغيرات التي يمكنك استخدامها:**\n` +
          `\`{user}\` → منشن العضو الجديد\n` +
          `\`{username}\` → اسم العضو\n` +
          `\`{server}\` → اسم السيرفر\n` +
          `\`{count}\` → رقم العضو في السيرفر\n\n` +
          `**مثال:**\n` +
          `👋 أهلًا {user} في **{server}**!\n` +
          `أنت العضو رقم **{count}** 🎉`,
        ephemeral: true,
      });

      return;
    }

    if (subcommand === "on") {
      const channel = await db.get(`welcome.${guildId}.channel`);

      if (!channel) {
        return interaction.reply({
          content: "❌ حدد قناة الترحيب أولًا باستخدام `/welcome setup`.",
          ephemeral: true,
        });
      }

      await db.set(`welcome.${guildId}.enabled`, true);

      await interaction.reply({
        content: "✅ تم تشغيل نظام الترحيب.",
        ephemeral: true,
      });

      return;
    }

    if (subcommand === "off") {
      await db.set(`welcome.${guildId}.enabled`, false);

      await interaction.reply({
        content: "🛑 تم إيقاف نظام الترحيب.",
        ephemeral: true,
      });

      return;
    }

    if (subcommand === "image") {
      const status = interaction.options.getString("status", true);

      await db.set(
        `welcome.${guildId}.image`,
        status === "on"
      );

      await interaction.reply({
        content:
          status === "on"
            ? "🖼️ تم تشغيل صورة العضو في رسالة الترحيب."
            : "🖼️ تم إيقاف صورة العضو في رسالة الترحيب.",
        ephemeral: true,
      });

      return;
    }

    if (subcommand === "show") {
      const channelId = await db.get(`welcome.${guildId}.channel`);
      const enabled = await db.get(`welcome.${guildId}.enabled`);
      const image = await db.get(`welcome.${guildId}.image`);
      const message = await db.get(`welcome.${guildId}.message`);

      await interaction.reply({
        content:
          `⚙️ **إعدادات الترحيب**\n\n` +
          `📢 القناة: ${channelId ? `<#${channelId}>` : "❌ غير محددة"}\n` +
          `🔘 الحالة: ${enabled ? "🟢 مفعّل" : "🔴 متوقف"}\n` +
          `🖼️ صورة العضو: ${image ? "🟢 مفعّلة" : "🔴 متوقفة"}\n` +
          `💬 الرسالة:\n${message || "❌ لم يتم تحديد رسالة"}`,
        ephemeral: true,
      });

      return;
    }
  },
};

export default welcome;
