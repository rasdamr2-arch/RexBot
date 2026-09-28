import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
} from "discord.js";

import { db } from "../database/db";

function xpNeeded(level: number) {
  return 100 + level * 50;
}

function getLevelData(totalXP: number) {
  let level = 0;
  let remainingXP = Math.max(0, totalXP);

  while (remainingXP >= xpNeeded(level)) {
    remainingXP -= xpNeeded(level);
    level++;
  }

  const needed = xpNeeded(level);
  const percent = Math.floor((remainingXP / needed) * 100);

  return {
    level,
    currentXP: remainingXP,
    neededXP: needed,
    percent,
  };
}

function createBar(percent: number) {
  const total = 10;
  const filled = Math.round((percent / 100) * total);

  return "█".repeat(filled) + "░".repeat(total - filled);
}

// ==================== PROFILE ====================

const profile = {
  data: new SlashCommandBuilder()
    .setName("profile")
    .setDescription("عرض ملفك ومستواك")
    .addUserOption(o =>
      o
        .setName("user")
        .setDescription("العضو")
        .setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const user =
      interaction.options.getUser("user") || interaction.user;

    const xp =
      Number(
        await db.get(`xp.${interaction.guildId}.${user.id}`)
      ) || 0;

    const savedLevel =
      Number(
        await db.get(`level.${interaction.guildId}.${user.id}`)
      );

    const levelData = getLevelData(xp);

    const level =
      Number.isFinite(savedLevel)
        ? savedLevel
        : levelData.level;

    const title =
      (await db.get(
        `title.${interaction.guildId}.${user.id}`
      )) || "بدون لقب";

    const bar = createBar(levelData.percent);

    await interaction.reply(
      `👤 **${user.tag}**\n\n` +
      `🏷️ اللقب: **${title}**\n` +
      `⭐ المستوى: **${level}**\n` +
      `✨ XP: **${levelData.currentXP} / ${levelData.neededXP}**\n` +
      `📊 التقدم: **${levelData.percent}%**\n` +
      `\`${bar}\``
    );
  },
};

// ==================== RANK ====================

const rank = {
  data: new SlashCommandBuilder()
    .setName("rank")
    .setDescription("عرض رتبتك"),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    const xp =
      Number(
        await db.get(
          `xp.${interaction.guildId}.${interaction.user.id}`
        )
      ) || 0;

    const levelData = getLevelData(xp);

    const level =
      Number(
        await db.get(
          `level.${interaction.guildId}.${interaction.user.id}`
        )
      ) || levelData.level;

    const bar = createBar(levelData.percent);

    await interaction.editReply(
      `🏆 **Rank**\n\n` +
      `👤 ${interaction.user}\n` +
      `⭐ Level: **${level}**\n` +
      `✨ XP: **${levelData.currentXP} / ${levelData.neededXP}**\n` +
      `📊 التقدم: **${levelData.percent}%**\n` +
      `\`${bar}\``
    );
  },
};

// ==================== TOP ====================

const top = {
  data: new SlashCommandBuilder()
    .setName("top")
    .setDescription("عرض أعلى الأعضاء"),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    const allXP =
      await db.get(`xp.${interaction.guildId}`);

    if (!allXP || typeof allXP !== "object") {
      return interaction.editReply(
        "📊 لا توجد بيانات XP حالياً."
      );
    }

    const rankings = Object.entries(allXP)
      .map(([userId, value]) => ({
        id: userId,
        xp: Number(value) || 0,
      }))
      .filter(x => x.xp > 0)
      .sort((a, b) => b.xp - a.xp)
      .slice(0, 10);

    if (rankings.length === 0) {
      return interaction.editReply(
        "📊 لا توجد بيانات XP حالياً."
      );
    }

    let text = "🏆 **Top 10 XP**\n\n";

    for (let i = 0; i < rankings.length; i++) {
      const user =
        await interaction.client.users
          .fetch(rankings[i].id)
          .catch(() => null);

      const name =
        user?.tag || `User ${rankings[i].id}`;

      const level =
        getLevelData(rankings[i].xp).level;

      text +=
        `**${i + 1}.** ${name} — ` +
        `Level ${level} — ${rankings[i].xp} XP\n`;
    }

    await interaction.editReply(text);
  },
};

// ==================== TITLE ====================

const title = {
  data: new SlashCommandBuilder()
    .setName("title")
    .setDescription("تعيين لقبك")
    .addStringOption(o =>
      o
        .setName("title")
        .setDescription("اللقب")
        .setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const value =
      interaction.options.getString("title", true);

    await db.set(
      `title.${interaction.guildId}.${interaction.user.id}`,
      value
    );

    await interaction.reply(
      `🏷️ تم تعيين لقبك إلى **${value}**`
    );
  },
};

// ==================== SET XP ====================

const setxp = {
  data: new SlashCommandBuilder()
    .setName("setxp")
    .setDescription("تعيين XP لعضو")
    .setDefaultMemberPermissions(
      PermissionFlagsBits.ManageGuild
    )
    .addUserOption(o =>
      o
        .setName("user")
        .setDescription("العضو")
        .setRequired(true)
    )
    .addIntegerOption(o =>
      o
        .setName("xp")
        .setDescription("قيمة XP")
        .setMinValue(0)
        .setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const user =
      interaction.options.getUser("user", true);

    const xp =
      interaction.options.getInteger("xp", true);

    await db.set(
      `xp.${interaction.guildId}.${user.id}`,
      xp
    );

    await interaction.reply(
      `✅ تم تعيين XP لـ **${user.tag}** إلى **${xp}**`
    );
  },
};

// ==================== SET LEVEL ====================

const setlevel = {
  data: new SlashCommandBuilder()
    .setName("setlevel")
    .setDescription("تعيين Level لعضو")
    .setDefaultMemberPermissions(
      PermissionFlagsBits.ManageGuild
    )
    .addUserOption(o =>
      o
        .setName("user")
        .setDescription("العضو")
        .setRequired(true)
    )
    .addIntegerOption(o =>
      o
        .setName("level")
        .setDescription("المستوى")
        .setMinValue(0)
        .setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const user =
      interaction.options.getUser("user", true);

    const level =
      interaction.options.getInteger("level", true);

    await db.set(
      `level.${interaction.guildId}.${user.id}`,
      level
    );

    await interaction.reply(
      `✅ تم تعيين Level لـ **${user.tag}** إلى **${level}**`
    );
  },
};

export default [
  profile,
  rank,
  top,
  title,
  setxp,
  setlevel,
];
