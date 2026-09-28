import dotenv from "dotenv";
import {
  Client,
  GatewayIntentBits,
  Collection,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  ChannelType,
  PermissionFlagsBits,
} from "discord.js";

import ping from "./commands/ping";
import help from "./commands/help";
import adminCommands from "./commands/admin";
import generalCommands from "./commands/general";
import levelingCommands from "./commands/leveling";
import infoCommands from "./commands/info";
import { db } from "./database/db";
import autorole from "./commands/autorole";
import ticket from "./commands/ticket";
import welcome from "./commands/welcome";

dotenv.config({ path: "../.env" });

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

const commands = new Collection<string, any>();

commands.set(ping.data.name, ping);
commands.set(help.data.name, help);
commands.set(autorole.data.name, autorole);
commands.set(ticket.data.name, ticket);
commands.set(welcome.data.name, welcome);

for (const command of adminCommands) {
  commands.set(command.data.name, command);
}

for (const command of generalCommands) {
  commands.set(command.data.name, command);
}

for (const command of levelingCommands) {
  commands.set(command.data.name, command);
}

for (const command of infoCommands) {
  commands.set(command.data.name, command);
}

// ==================== READY ====================

client.once("ready", () => {
  console.log(`✅ Bot is online as ${client.user?.tag}`);
  console.log(`📦 Loaded ${commands.size} commands`);
});


// ==================== WELCOME SYSTEM ====================

client.on("guildMemberAdd", async member => {
  try {
    const guildId = member.guild.id;

    const enabled = await db.get(`welcome.${guildId}.enabled`);
    if (!enabled) return;

    const channelId = await db.get(`welcome.${guildId}.channel`);
    if (!channelId) return;

    const channel = member.guild.channels.cache.get(channelId);

    if (!channel || channel.type !== ChannelType.GuildText) {
      return;
    }

    let message = await db.get(`welcome.${guildId}.message`);

    if (!message) {
      message =
        "👋 أهلًا {user} في **{server}**!\\nأنت العضو رقم **{count}** 🎉";
    }

    message = String(message)
      .replace(/{user}/g, `${member}`)
      .replace(/{username}/g, member.user.username)
      .replace(/{server}/g, member.guild.name)
      .replace(/{count}/g, String(member.guild.memberCount));

    const showImage = await db.get(`welcome.${guildId}.image`);

    if (showImage) {
      const embed = new EmbedBuilder()
        .setDescription(message)
        .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
        .setColor(0x5865f2)
        .setFooter({
          text: `عضو جديد • ${member.guild.name}`,
        });

      await channel.send({
        embeds: [embed],
      });
    } else {
      await channel.send(message);
    }

  } catch (error) {
    console.error("❌ Welcome error:", error);
  }
});

// ==================== XP SYSTEM ====================

const xpCooldown = new Map<string, number>();

function xpNeeded(level: number) {
  return 100 + level * 50;
}

function getLevel(totalXP: number) {
  let level = 0;
  let remaining = Math.max(0, totalXP);

  while (remaining >= xpNeeded(level)) {
    remaining -= xpNeeded(level);
    level++;
  }

  return {
    level,
    currentXP: remaining,
    neededXP: xpNeeded(level),
  };
}

client.on("messageCreate", async message => {
  if (!message.guild) return;
  if (message.author.bot) return;

  const cooldownKey =
    `${message.guild.id}:${message.author.id}`;

  const now = Date.now();
  const last =
    xpCooldown.get(cooldownKey) || 0;

  if (now - last < 60_000) return;

  xpCooldown.set(cooldownKey, now);

  const xpKey =
    `xp.${message.guild.id}.${message.author.id}`;

  const oldXP =
    Number(await db.get(xpKey)) || 0;

  const oldData = getLevel(oldXP);

  const gained =
    Math.floor(Math.random() * 11) + 15;

  const newXP = oldXP + gained;

  const newData = getLevel(newXP);

  await db.set(xpKey, newXP);

  if (newData.level > oldData.level) {
    await db.set(
      `level.${message.guild.id}.${message.author.id}`,
      newData.level
    );

    const embed = new EmbedBuilder()
      .setTitle("🎉 Level Up!")
      .setDescription(
        `مبروك ${message.author}!\n\n` +
        `⭐ وصلت إلى **Level ${newData.level}**`
      )
      .addFields({
        name: "✨ XP",
        value: `${newXP} XP`,
        inline: true,
      })
      .setThumbnail(
        message.author.displayAvatarURL()
      )
      .setTimestamp();

    await message.channel.send({
      embeds: [embed],
    });
  }
});

// ==================== COMMANDS ====================

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command =
    commands.get(interaction.commandName);

  if (!command) {
    return interaction.reply({
      content: "❌ هذا الأمر غير موجود.",
      ephemeral: true,
    });
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: "❌ حدث خطأ أثناء تنفيذ الأمر.",
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: "❌ حدث خطأ أثناء تنفيذ الأمر.",
        ephemeral: true,
      });
    }
  }
});

client.login(process.env.DISCORD_BOT_TOKEN);
