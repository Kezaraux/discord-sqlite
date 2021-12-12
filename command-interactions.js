const { DiscordInteractions } = require("slash-commands");

const { token, clientId, publicKey, guildId } = require("./config.json");

const interaction = new DiscordInteractions({
    applicationId: clientId,
    authToken: token,
    publicKey
});

const displayGlobalCommands = async () => {
    const globalCommands = await interaction.getApplicationCommands();
    console.log(globalCommands);
};

const displayGuildCommands = async () => {
    const guildCommands = await interaction.getApplicationCommands(guildId);
    console.log(guildCommands);
};

const cmdId = "putIdHere";

const deleteExtraGuildCommands = async () => {
    await interaction.deleteApplicationCommand(cmdId, guildId);
};

displayGlobalCommands();
displayGuildCommands();
