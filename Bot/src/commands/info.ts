import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from "discord.js";

const user = {
  data: new SlashCommandBuilder()
    .setName("user")
    .setDescription("عرض معلومات عضو")
    .addUserOption(o =>
      o.setName("member").setDescription("العضو").setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getUser("member") || interaction.user;

    const embed = new EmbedBuilder()
      .setTitle(`👤 ${target.tag}`)
      .setThumbnail(target.displayAvatarURL())
      .addFields(
        { name: "ID", value: target.id },
        {
          name: "Bot",
          value: target.bot ? "نعم" : "لا",
        }
      );

    await interaction.reply({ embeds: [embed] });
  },
};

const avatar = {
  data: new SlashCommandBuilder()
    .setName("avatar")
    .setDescription("عرض صورة عضو")
    .addUserOption(o =>
      o.setName("user").setDescription("العضو").setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getUser("user") || interaction.user;

    await interaction.reply(target.displayAvatarURL({ size: 1024 }));
  },
};

const server = {
  data: new SlashCommandBuilder()
    .setName("server")
    .setDescription("معلومات السيرفر"),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return;

    const embed = new EmbedBuilder()
      .setTitle(`🏠 ${interaction.guild.name}`)
      .addFields(
        {
          name: "👥 Members",
          value: `${interaction.guild.memberCount}`,
        },
        {
          name: "🆔 ID",
          value: interaction.guild.id,
        },
        {
          name: "👑 Owner",
          value: `<@${interaction.guild.ownerId}>`,
        }
      );

    await interaction.reply({ embeds: [embed] });
  },
};

const roles = {
  data: new SlashCommandBuilder()
    .setName("roles")
    .setDescription("عرض رتب السيرفر"),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return;

    const list = interaction.guild.roles.cache
      .filter(r => r.id !== interaction.guild!.id)
      .map(r => `<@&${r.id}>`)
      .slice(0, 50)
      .join(" ");

    await interaction.reply(
      list || "❌ لا توجد رتب."
    );
  },
};

export default [
  user,
  avatar,
  server,
  roles,
];
