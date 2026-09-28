import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("ping")
  .setDescription("Check if the bot is online");

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.reply("🏓 Pong!");
}

export default { data, execute };
