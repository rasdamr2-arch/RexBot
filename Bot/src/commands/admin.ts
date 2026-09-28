import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
} from "discord.js";
import fs from "fs";
import path from "path";

const warningsPath = path.join(__dirname, "../database/warnings.json");

function loadWarnings(): Record<string, string[]> {
  if (!fs.existsSync(warningsPath)) {
    fs.writeFileSync(warningsPath, "{}");
  }

  return JSON.parse(fs.readFileSync(warningsPath, "utf8"));
}

function saveWarnings(data: Record<string, string[]>) {
  fs.writeFileSync(warningsPath, JSON.stringify(data, null, 2));
}

// BAN
const ban = {
  data: new SlashCommandBuilder()
    .setName("ban")
    .setDescription("حظر عضو من السيرفر")
    .addUserOption(o =>
      o.setName("user").setDescription("العضو").setRequired(true)
    )
    .addStringOption(o =>
      o.setName("reason").setDescription("السبب").setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction: ChatInputCommandInteraction) {
    const user = interaction.options.getUser("user", true);
    const reason =
      interaction.options.getString("reason") || "No reason provided";

    if (!interaction.guild) return;

    try {
      await interaction.guild.members.ban(user.id, { reason });

      await interaction.reply(
        `🔨 تم حظر **${user.tag}**.\nالسبب: ${reason}`
      );
    } catch {
      await interaction.reply({
        content: "❌ ما كدرت أحظر العضو. تأكد من الصلاحيات وترتيب الرتب.",
        ephemeral: true,
      });
    }
  },
};

// KICK
const kick = {
  data: new SlashCommandBuilder()
    .setName("kick")
    .setDescription("طرد عضو من السيرفر")
    .addUserOption(o =>
      o.setName("user").setDescription("العضو").setRequired(true)
    )
    .addStringOption(o =>
      o.setName("reason").setDescription("السبب").setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

  async execute(interaction: ChatInputCommandInteraction) {
    const user = interaction.options.getUser("user", true);
    const reason =
      interaction.options.getString("reason") || "No reason provided";

    if (!interaction.guild) return;

    try {
      await interaction.guild.members.kick(user.id, reason);

      await interaction.reply(
        `👢 تم طرد **${user.tag}**.\nالسبب: ${reason}`
      );
    } catch {
      await interaction.reply({
        content: "❌ ما كدرت أطرد العضو. تأكد من الصلاحيات وترتيب الرتب.",
        ephemeral: true,
      });
    }
  },
};

// CLEAR
const clear = {
  data: new SlashCommandBuilder()
    .setName("clear")
    .setDescription("حذف رسائل من القناة")
    .addIntegerOption(o =>
      o
        .setName("amount")
        .setDescription("عدد الرسائل")
        .setMinValue(1)
        .setMaxValue(100)
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageMessages)) {
      return interaction.reply({
        content: "❌ ما عندك صلاحية Manage Messages.",
        ephemeral: true,
      });
    }

    if (!interaction.channel || !("bulkDelete" in interaction.channel)) {
      return interaction.reply({
        content: "❌ ما أگدر أحذف الرسائل من هذه القناة.",
        ephemeral: true,
      });
    }

    const amount = interaction.options.getInteger("amount", true);

    await interaction.deferReply({ ephemeral: true });

    try {
      const deleted = await interaction.channel.bulkDelete(amount, true);

      await interaction.editReply(
        `🧹 تم حذف **${deleted.size}** رسالة.`
      );
    } catch {
      await interaction.editReply(
        "❌ حدث خطأ أثناء حذف الرسائل."
      );
    }
  },
};

// MUTE
const mute = {
  data: new SlashCommandBuilder()
    .setName("mute")
    .setDescription("كتم عضو لمدة محددة")
    .addUserOption(o =>
      o.setName("user").setDescription("العضو").setRequired(true)
    )
    .addIntegerOption(o =>
      o
        .setName("minutes")
        .setDescription("المدة بالدقائق")
        .setMinValue(1)
        .setMaxValue(40320)
        .setRequired(true)
    )
    .addStringOption(o =>
      o.setName("reason").setDescription("السبب").setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction: ChatInputCommandInteraction) {
    const user = interaction.options.getUser("user", true);
    const minutes = interaction.options.getInteger("minutes", true);
    const reason =
      interaction.options.getString("reason") || "No reason provided";

    if (!interaction.guild) return;

    try {
      const member = await interaction.guild.members.fetch(user.id);

      await member.timeout(minutes * 60 * 1000, reason);

      await interaction.reply(
        `🔇 تم كتم **${user.tag}** لمدة **${minutes} دقيقة**.\nالسبب: ${reason}`
      );
    } catch {
      await interaction.reply({
        content: "❌ ما كدرت أكتم العضو. تأكد من الصلاحيات وترتيب الرتب.",
        ephemeral: true,
      });
    }
  },
};

// UNMUTE
const unmute = {
  data: new SlashCommandBuilder()
    .setName("unmute")
    .setDescription("فك كتم عضو")
    .addUserOption(o =>
      o.setName("user").setDescription("العضو").setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction: ChatInputCommandInteraction) {
    const user = interaction.options.getUser("user", true);

    if (!interaction.guild) return;

    try {
      const member = await interaction.guild.members.fetch(user.id);

      await member.timeout(null);

      await interaction.reply(
        `🔊 تم فك الكتم عن **${user.tag}**.`
      );
    } catch {
      await interaction.reply({
        content: "❌ ما كدرت أفك الكتم.",
        ephemeral: true,
      });
    }
  },
};

// WARN
const warn = {
  data: new SlashCommandBuilder()
    .setName("warn")
    .setDescription("تحذير عضو")
    .addUserOption(o =>
      o.setName("user").setDescription("العضو").setRequired(true)
    )
    .addStringOption(o =>
      o
        .setName("reason")
        .setDescription("سبب التحذير")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction: ChatInputCommandInteraction) {
    const user = interaction.options.getUser("user", true);
    const reason = interaction.options.getString("reason", true);

    const warnings = loadWarnings();
    const key = `${interaction.guildId}:${user.id}`;

    if (!warnings[key]) {
      warnings[key] = [];
    }

    warnings[key].push(reason);
    saveWarnings(warnings);

    await interaction.reply(
      `⚠️ تم تحذير **${user.tag}**.\nالسبب: ${reason}\nعدد التحذيرات: **${warnings[key].length}**`
    );
  },
};

// WARNINGS
const warningsCommand = {
  data: new SlashCommandBuilder()
    .setName("warnings")
    .setDescription("عرض تحذيرات عضو")
    .addUserOption(o =>
      o.setName("user").setDescription("العضو").setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction: ChatInputCommandInteraction) {
    const user = interaction.options.getUser("user", true);

    const warnings = loadWarnings();
    const key = `${interaction.guildId}:${user.id}`;
    const list = warnings[key] || [];

    if (list.length === 0) {
      return interaction.reply(
        `✅ **${user.tag}** ما عنده تحذيرات.`
      );
    }

    const text = list
      .map((reason, i) => `**${i + 1}.** ${reason}`)
      .join("\n");

    await interaction.reply(
      `⚠️ تحذيرات **${user.tag}** (${list.length}):\n${text}`
    );
  },
};

// UNWARN
const unwarn = {
  data: new SlashCommandBuilder()
    .setName("unwarn")
    .setDescription("إزالة آخر تحذير من عضو")
    .addUserOption(o =>
      o.setName("user").setDescription("العضو").setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction: ChatInputCommandInteraction) {
    const user = interaction.options.getUser("user", true);

    const warnings = loadWarnings();
    const key = `${interaction.guildId}:${user.id}`;

    if (!warnings[key] || warnings[key].length === 0) {
      return interaction.reply(
        "❌ هذا العضو ما عنده تحذيرات."
      );
    }

    warnings[key].pop();

    if (warnings[key].length === 0) {
      delete warnings[key];
    }

    saveWarnings(warnings);

    await interaction.reply(
      `✅ تمت إزالة آخر تحذير عن **${user.tag}**.`
    );
  },
};

// LOCK
const lock = {
  data: new SlashCommandBuilder()
    .setName("lock")
    .setDescription("قفل القناة الحالية")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild || !interaction.channel) {
      return interaction.reply({
        content: "❌ هذا الأمر يعمل داخل السيرفر فقط.",
        ephemeral: true,
      });
    }

    try {
      const channel = await interaction.guild.channels.fetch(
        interaction.channel.id
      );

      if (!channel || !("permissionOverwrites" in channel)) {
        return interaction.reply({
          content: "❌ هذه القناة لا تدعم القفل.",
          ephemeral: true,
        });
      }

      await channel.permissionOverwrites.edit(
        interaction.guild.roles.everyone,
        { SendMessages: false }
      );

      await interaction.reply("🔒 تم قفل القناة.");
    } catch {
      await interaction.reply({
        content: "❌ ما كدرت أقفل القناة.",
        ephemeral: true,
      });
    }
  },
};

// UNLOCK
const unlock = {
  data: new SlashCommandBuilder()
    .setName("unlock")
    .setDescription("فتح القناة الحالية")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild || !interaction.channel) {
      return interaction.reply({
        content: "❌ هذا الأمر يعمل داخل السيرفر فقط.",
        ephemeral: true,
      });
    }

    try {
      const channel = await interaction.guild.channels.fetch(
        interaction.channel.id
      );

      if (!channel || !("permissionOverwrites" in channel)) {
        return interaction.reply({
          content: "❌ هذه القناة لا تدعم الفتح.",
          ephemeral: true,
        });
      }

      await channel.permissionOverwrites.edit(
        interaction.guild.roles.everyone,
        { SendMessages: null }
      );

      await interaction.reply("🔓 تم فتح القناة.");
    } catch {
      await interaction.reply({
        content: "❌ ما كدرت أفتح القناة.",
        ephemeral: true,
      });
    }
  },
};

// SLOWMODE
const slowmode = {
  data: new SlashCommandBuilder()
    .setName("slowmode")
    .setDescription("تحديد Slowmode للقناة")
    .addIntegerOption(o =>
      o
        .setName("seconds")
        .setDescription("الثواني")
        .setMinValue(0)
        .setMaxValue(21600)
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction: ChatInputCommandInteraction) {
    const seconds = interaction.options.getInteger("seconds", true);

    if (
      !interaction.channel ||
      !("setRateLimitPerUser" in interaction.channel)
    ) {
      return interaction.reply({
        content: "❌ ما أگدر أغير Slowmode بهذه القناة.",
        ephemeral: true,
      });
    }

    try {
      await interaction.channel.setRateLimitPerUser(seconds);

      await interaction.reply(
        seconds === 0
          ? "⚡ تم إلغاء Slowmode."
          : `🐌 تم ضبط Slowmode على **${seconds} ثانية**.`
      );
    } catch {
      await interaction.reply({
        content: "❌ ما كدرت أغير Slowmode.",
        ephemeral: true,
      });
    }
  },
};

// UNBAN
const unban = {
  data: new SlashCommandBuilder()
    .setName("unban")
    .setDescription("فك حظر مستخدم")
    .addStringOption(o =>
      o
        .setName("userid")
        .setDescription("Discord User ID")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction: ChatInputCommandInteraction) {
    const userId = interaction.options.getString("userid", true);

    if (!interaction.guild) return;

    try {
      await interaction.guild.members.unban(userId);

      await interaction.reply(
        `✅ تم فك الحظر عن **${userId}**.`
      );
    } catch {
      await interaction.reply({
        content: "❌ ما كدرت أفك الحظر. تأكد من User ID.",
        ephemeral: true,
      });
    }
  },
};

export const commands = [
  ban,
  kick,
  clear,
  mute,
  unmute,
  warn,
  warningsCommand,
  unwarn,
  lock,
  unlock,
  slowmode,
  unban,
];

export default commands;
