import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  ChannelType,
} from "discord.js";

import { db } from "../database/db";

// ==================== CREDITS ====================

const credits = {
  data: new SlashCommandBuilder()
    .setName("credits")
    .setDescription("عرض رصيدك أو رصيد عضو")
    .addUserOption(o =>
      o.setName("user").setDescription("العضو").setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const user =
      interaction.options.getUser("user") || interaction.user;

    const key = `credits.${interaction.guildId}.${user.id}`;
    const balance = (await db.get(key)) || 0;

    await interaction.reply(
      `💰 رصيد **${user.tag}**: **${balance} credits**`
    );
  },
};

// ==================== REP ====================

const rep = {
  data: new SlashCommandBuilder()
    .setName("rep")
    .setDescription("إعطاء سمعة لعضو")
    .addUserOption(o =>
      o.setName("user").setDescription("العضو").setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const user = interaction.options.getUser("user", true);

    if (user.id === interaction.user.id) {
      return interaction.reply({
        content: "❌ ما تكدر تعطي Rep لنفسك.",
        ephemeral: true,
      });
    }

    const key = `rep.${interaction.guildId}.${user.id}`;
    const current = (await db.get(key)) || 0;

    await db.set(key, current + 1);

    await interaction.reply(
      `⭐ تم إعطاء **${user.tag}** نقطة Rep!\n📊 مجموع Rep: **${current + 1}**`
    );
  },
};

// ==================== MOVEME ====================

const moveme = {
  data: new SlashCommandBuilder()
    .setName("moveme")
    .setDescription("نقل نفسك إلى قناة صوتية")
    .addChannelOption(o =>
      o
        .setName("channel")
        .setDescription("القناة الصوتية")
        .addChannelTypes(
          ChannelType.GuildVoice,
          ChannelType.GuildStageVoice
        )
        .setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return;

    const member = await interaction.guild.members.fetch(
      interaction.user.id
    );

    const channel = interaction.options.getChannel("channel", true);

    if (
      channel.type !== ChannelType.GuildVoice &&
      channel.type !== ChannelType.GuildStageVoice
    ) {
      return interaction.reply({
        content: "❌ لازم تختار قناة صوتية.",
        ephemeral: true,
      });
    }

    if (!member.voice.channel) {
      return interaction.reply({
        content: "❌ لازم تكون داخل قناة صوتية أولًا.",
        ephemeral: true,
      });
    }

    try {
      await member.voice.setChannel(channel.id);

      await interaction.reply(
        `🔊 تم نقلك إلى **${channel.name}**.`
      );
    } catch {
      await interaction.reply({
        content: "❌ ما كدرت أنقلك. تأكد من صلاحيات البوت.",
        ephemeral: true,
      });
    }
  },
};

// ==================== COLOR ====================

const color = {
  data: new SlashCommandBuilder()
    .setName("color")
    .setDescription("تغيير لونك")
    .addStringOption(o =>
      o
        .setName("hex")
        .setDescription("مثال: #ff0000")
        .setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const hex = interaction.options.getString("hex", true);

    if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) {
      return interaction.reply({
        content: "❌ استخدم لون HEX صحيح مثل `#ff0000`.",
        ephemeral: true,
      });
    }

    await interaction.reply(
      `🎨 تم اختيار اللون **${hex}**.`
    );
  },
};

// ==================== COLORS ====================

const colors = {
  data: new SlashCommandBuilder()
    .setName("colors")
    .setDescription("عرض الألوان المتاحة"),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.reply(
      "🎨 الألوان المتاحة حاليًا:\n" +
        "`#ff0000` 🔴\n" +
        "`#00ff00` 🟢\n" +
        "`#0000ff` 🔵\n" +
        "`#ffff00` 🟡\n" +
        "`#ffffff` ⚪\n" +
        "`#000000` ⚫"
    );
  },
};

// ==================== SHORT ====================

const short = {
  data: new SlashCommandBuilder()
    .setName("short")
    .setDescription("اختصار رابط")
    .addStringOption(o =>
      o
        .setName("url")
        .setDescription("الرابط")
        .setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const url = interaction.options.getString("url", true);

    try {
      new URL(url);
    } catch {
      return interaction.reply({
        content: "❌ هذا مو رابط صحيح.",
        ephemeral: true,
      });
    }

    await interaction.reply(
      `🔗 الرابط المستلم:\n${url}\n\n⚠️ خدمة اختصار الروابط تحتاج API خارجي.`
    );
  },
};

// ==================== ROLL ====================

const roll = {
  data: new SlashCommandBuilder()
    .setName("roll")
    .setDescription("رمي النرد")
    .addIntegerOption(o =>
      o
        .setName("sides")
        .setDescription("عدد أوجه النرد")
        .setMinValue(2)
        .setMaxValue(1000)
        .setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const sides =
      interaction.options.getInteger("sides") || 6;

    const result =
      Math.floor(Math.random() * sides) + 1;

    await interaction.reply(
      `🎲 النتيجة: **${result} / ${sides}**`
    );
  },
};

// ==================== EXPORT ====================

export default [
  credits,
  rep,
  moveme,
  color,
  colors,
  short,
  roll,
];
