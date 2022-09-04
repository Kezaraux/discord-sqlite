const fs = require("fs");
const winston = require("winston");
const { REST } = require("@discordjs/rest");

const { Client, Collection, Routes, GatewayIntentBits } = require("discord.js");
const { token, guildId, clientId, token2, clientId2 } = require("./config.json");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildScheduledEvents,
    ],
});
client.commands = new Collection();
client.buttonHandlers = new Collection();
client.modalHandlers = new Collection();

const logger = winston.createLogger({
    transports: [new winston.transports.Console()],
    format: winston.format.printf(log => `[${log.level.toUpperCase()}] - ${log.message}`),
});

// Register commands
const cmds = [];
const commandFiles = fs.readdirSync("./commands").filter(file => file.endsWith(".js"));
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    logger.info(`Registering command: ${command.data.name}`);
    client.commands.set(command.data.name, command);
    cmds.push(command.data);
}

// Register context menu commands - handled same as commands
const contextMenuFiles = fs.readdirSync("./contextMenus").filter(file => file.endsWith(".js"));
for (const file of contextMenuFiles) {
    const contextMenuCommand = require(`./contextMenus/${file}`);
    logger.info(`Registering context menu command: ${contextMenuCommand.data.name}`);
    client.commands.set(contextMenuCommand.data.name, contextMenuCommand);
    cmds.push(contextMenuCommand.data);
}

// Register event listeners
const eventFiles = fs.readdirSync("./events").filter(file => file.endsWith(".js"));
for (const file of eventFiles) {
    const event = require(`./events/${file}`);
    logger.info(`Registering event: ${event.name}`);
    if (event.once) {
        client.once(
            event.name,
            async (...args) => await event.execute({ ...args, client, logger }),
        );
    } else {
        client.on(event.name, async (...args) => await event.execute({ ...args, client, logger }));
    }
}

// Register button handlers
const buttonHandlerFiles = fs
    .readdirSync("./messageComponentHandlers")
    .filter(file => file.endsWith(".js"));
for (const file of buttonHandlerFiles) {
    const handler = require(`./messageComponentHandlers/${file}`);
    logger.info(`Registering button handler: ${handler.name}`);
    client.buttonHandlers.set(handler.name, handler);
}

// Register modal handlers
const modalHandlerFiles = fs.readdirSync("./modalHandlers").filter(file => file.endsWith(".js"));
for (const file of modalHandlerFiles) {
    const handler = require(`./modalHandlers/${file}`);
    logger.info(`Registering modal handler: ${handler.name}`);
    client.modalHandlers.set(handler.name, handler);
}

client.once("ready", async () => {
    logger.info("Registering commands with the API");

    const rest = new REST({ version: "10" }).setToken(token);

    rest.put(Routes.applicationGuildCommands(clientId, guildId), {
        body: cmds.map(cmd => cmd.toJSON()),
    })
        .then(() => {
            logger.info("Successfully registered application commands");
        })
        .catch(console.error);

    const featureFiles = fs.readdirSync("./features");
    for (const file of featureFiles) {
        const feature = require(`./features/${file}`);
        logger.info(`Registering feature: ${feature.name}`);
        feature.execute(client, logger);
    }

    logger.info("The bot is ready to handle commands!");
});

client.login(token);
