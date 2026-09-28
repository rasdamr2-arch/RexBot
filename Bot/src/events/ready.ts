import { Client } from "discord.js";

export const once = true;

export function execute(client: Client) {
  console.log(`Bot is online as ${client.user?.tag}`);
}
