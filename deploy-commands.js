const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const { clientId, guildId, token } = require("./config.json");
const fs = require("fs");

const commandFiles = fs.readdirSync("./commands").filter((file) => file.endsWith(".js"));
const commands = [];
for (file of commandFiles) {
    const command = require(`./commands/${file}`);
    commands.push(command.data);
}

const rest = new REST({ version: "9" }).setToken(token);

rest.put(Routes.applicationCommands(clientId), {
    body: commands.map((cmd) => cmd.toJSON())
})
    .then(() => console.log("Successfully registered application commands."))
    .catch(console.error);
