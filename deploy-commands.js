const { REST, Routes } = require("discord.js");
const { clientId, token } = require("./config.json");
const fs = require("node:fs");
const path = require("node:path");

const commands = [];
const commandsFolder = path.join(__dirname, "commands");
const commandFiles = fs.readdirSync(commandsFolder).filter(file => file.endsWith(".js"));

for (file of commandFiles) {
    const filePath = path.join(commandsFolder, file);
    const command = require(filePath);

    if (command.disabled) {
        console.log(`Skipping the command at ${filePath} since it is marked as disabled.`);
        continue;
    }

    if (command.devOnly) {
        console.log(`Skipping the command at ${filePath} since it is marked as dev only.`);
        continue;
    }

    if ("data" in command && "execute" in command) {
        commands.push(command.data.toJSON());
    } else {
        console.log(
            `[WARNING] The command at ${filePath} is missing required "data" or "execute" property.`,
        );
    }
}

const contextMenuFolder = path.join(__dirname, "contextMenus");
const contextMenuFiles = fs.readdirSync(contextMenuFolder).filter(file => file.endsWith(".js"));

for (file of contextMenuFiles) {
    const filePath = path.join(contextMenuFolder, file);
    const contextMenu = require(filePath);

    if (contextMenu.disabled) {
        console.log(`Skipping the context menu at ${filePath} since it is marked as disabled.`);
        continue;
    }

    if (contextMenu.devOnly) {
        console.log(`Skipping the command at ${filePath} since it is marked as dev only.`);
        continue;
    }

    if ("data" in contextMenu && "execute" in contextMenu) {
        commands.push(contextMenu.data.toJSON());
    } else {
        console.log(
            `[WARNING] The command at ${filePath} is missing required "data" or "execute" property.`,
        );
    }
}

const rest = new REST().setToken(token);

(async () => {
    try {
        console.log(`Started refreshing ${commands.length} application (/) commands.`);

        const data = await rest.put(Routes.applicationCommands(clientId), {
            body: commands,
        });

        console.log(`Successfully reloaded ${data.length} application (/) commands.`);
    } catch (error) {
        console.error(error);
    }
})();
