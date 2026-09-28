import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("help")
  .setDescription("عرض جميع أوامر البوت");

export async function execute(interaction: ChatInputCommandInteraction) {
  const embed = new EmbedBuilder()
    .setTitle("🤖 RexBot — Help")
    .setDescription("قائمة أوامر البوت المتاحة:")

    .addFields(
      {
        name: "🛡️ Moderation",
        value:
          "`/ban` `/unban` `/kick` `/clear`\n" +
          "`/mute` `/unmute` `/warn` `/warnings`\n" +
          "`/unwarn` `/lock` `/unlock` `/slowmode`",
      },

      {
        name: "🎫 Tickets",
        value:
          "`/ticket setup` `/ticket close`",
      },

      {
        name: "🎖️ Auto Role",
        value:
          "`/autorole set` `/autorole show` `/autorole remove`",
      },

      {
        name: "💎 Points",
        value:
          "`/points set` `/points list`\n" +
          "`/points increase` `/points decrease` `/points reset`",
      },

      {
        name: "💰 General",
        value:
          "`/credits` `/rep` `/moveme`\n" +
          "`/color` `/colors` `/short` `/roll`",
      },

      {
        name: "⭐ Leveling",
        value:
          "`/profile` `/rank` `/top`\n" +
          "`/title` `/setxp` `/setlevel`",
      },

      {
        name: "ℹ️ Information",
        value:
          "`/user` `/avatar` `/server` `/roles`",
      },

      {
        name: "🤖 Bot",
        value:
          "`/ping` `/help`",
      }
    )

    .setFooter({
      text: "RexBot • Command List",
    })
    .setTimestamp();

  await interaction.reply({
    embeds: [embed],
  });
}

export default { data, execute };
