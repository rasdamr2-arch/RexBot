import dotenv from "dotenv";
import { REST, Routes } from "discord.js";
import fs from "fs";
import path from "path";

dotenv.config({ path: "../.env" });

const commands: any[] = [];
const commandsPath = path.join(__dirname, "commands");

for (const file of fs.readdirSync(commandsPath)) {
  if (!file.endsWith(".ts")) continue;

  const loaded = require(path.join(commandsPath, file));

  // ملف يحتوي على أمر واحد
  if (loaded.default?.data) {
    commands.push(loaded.default.data.toJSON());
    continue;
  }

  if (loaded.data) {
    commands.push(loaded.data.toJSON());
    continue;
  }

  // ملف يحتوي على مجموعة أوامر
  if (Array.isArray(loaded.default)) {
    for (const command of loaded.default) {
      commands.push(command.data.toJSON());
    }
    continue;
  }

  if (loaded.commands) {
    for (const command of loaded.commands) {
      commands.push(command.data.toJSON());
    }
  }
}

// إزالة أي تكرار احتياطيًا
const uniqueCommands = Array.from(
  new Map(commands.map(command => [command.name, command])).values()
);

console.log("\n📋 Commands found:\n");

uniqueCommands.forEach((command, index) => {
  console.log(`${index + 1}. /${command.name}`);
});

console.log(`\n📦 Total unique commands: ${uniqueCommands.length}`);

const rest = new REST({ version: "10" }).setToken(
  process.env.DISCORD_BOT_TOKEN!
);

(async () => {
  try {
    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID!,
        "1553898502839336992"
      ),
      {
        body: uniqueCommands,
      }
    );

    console.log(
      `\n✅ Successfully registered ${uniqueCommands.length} commands.`
    );
  } catch (error) {
    console.error("\n❌ Discord registration error:");
    console.error(error);
  }
})();
