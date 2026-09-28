import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
} from "discord.js";

import { db } from "../database/db";

const autorole = {
  data: new SlashCommandBuilder()
    .setName("autorole")
    .setDescription("إدارة الرتبة التلقائية")

    .addSubcommand(sub =>
      sub
        .setName("set")
        .setDescription("تحديد الرتبة التلقائية")
        .addRoleOption(o =>
          o
            .setName("role")
            .setDescription("الرتبة")
            .setRequired(true)
        )
    )

    .addSubcommand(sub =>
      sub
        .setName("remove")
        .setDescription("إلغاء الرتبة التلقائية")
    )

    .addSubcommand(sub =>
      sub
        .setName("show")
        .setDescription("عرض الرتبة التلقائية الحالية")
    )

    .setDefaultMemberPermissions(
      PermissionFlagsBits.ManageGuild
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return;

    const sub = interaction.options.getSubcommand();

    if (sub === "set") {
      const role = interaction.options.getRole("role", true);

      const me = interaction.guild.members.me;

      if (!me) {
        return interaction.reply({
          content: "❌ ما كدرت أتحقق من صلاحياتي.",
          ephemeral: true,
        });
      }

      if (role.position >= me.roles.highest.position) {
        return interaction.reply({
          content:
            "❌ ما أكدر أعطي هاي الرتبة لأن رتبة البوت لازم تكون أعلى منها.",
          ephemeral: true,
        });
      }

      await db.set(
        `autorole.${interaction.guild.id}`,
        role.id
      );

      return interaction.reply(
        `✅ تم تحديد ${role} كرتبة تلقائية.\n` +
        `أي عضو جديد يدخل راح يحصل عليها تلقائيًا.`
      );
    }

    if (sub === "remove") {
      await db.delete(
        `autorole.${interaction.guild.id}`
      );

      return interaction.reply(
        "✅ تم إلغاء الرتبة التلقائية."
      );
    }

    if (sub === "show") {
      const roleId = await db.get(
        `autorole.${interaction.guild.id}`
      );

      if (!roleId) {
        return interaction.reply(
          "ℹ️ ماكو رتبة تلقائية محددة."
        );
      }

      const role =
        interaction.guild.roles.cache.get(roleId);

      if (!role) {
        return interaction.reply(
          "⚠️ الرتبة المحفوظة لم تعد موجودة."
        );
      }

      return interaction.reply(
        `🎖️ الرتبة التلقائية الحالية: ${role}`
      );
    }
  },
};

export default autorole;
