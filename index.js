const fs = require("fs");
const winston = require("winston");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");

const { Client, Collection, Intents } = require("discord.js");
const { token, guildId, clientId, token2, clientId2 } = require("./config.json");

const client = new Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_MESSAGES]
});
client.commands = new Collection();
client.buttonHandlers = new Collection();

const logger = winston.createLogger({
    transports: [new winston.transports.Console()],
    format: winston.format.printf((log) => `[${log.level.toUpperCase()}] - ${log.message}`)
});

// Register commands
const cmds = [];
const commandFiles = fs.readdirSync("./commands").filter((file) => file.endsWith(".js"));
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.data.name, command);
    cmds.push(command.data);
}

// Register event listeners
const eventFiles = fs.readdirSync("./events").filter((file) => file.endsWith(".js"));
for (const file of eventFiles) {
    const event = require(`./events/${file}`);
    if (event.once) {
        client.once(
            event.name,
            async (...args) => await event.execute({ ...args, client, logger })
        );
    } else {
        client.on(event.name, async (...args) => await event.execute({ ...args, client, logger }));
    }
}

// Register button handlers
const buttonHandlerFiles = fs
    .readdirSync("./buttonHandlers")
    .filter((file) => file.endsWith(".js"));
for (const file of buttonHandlerFiles) {
    const handler = require(`./buttonHandlers/${file}`);
    client.buttonHandlers.set(handler.name, handler);
}

client.once("ready", async () => {
    logger.info("Registering commands");

    const rest = new REST({ version: "9" }).setToken(token);

    rest.put(Routes.applicationGuildCommands(clientId, guildId), {
        body: cmds.map((cmd) => cmd.toJSON())
    })
        .then(() => {
            logger.info("Successfully registered application commands");
        })
        .catch(console.error);

    const featureFiles = fs.readdirSync("./features");
    for (const file of featureFiles) {
        const feature = require(`./features/${file}`);
        feature.execute(client, logger);
    }

    logger.info("The bot is ready to handle commands!");
});

client.login(token);
