const { DiscordInteractions } = require("slash-commands");

const { token, clientId, publicKey, guildId } = require("./config.json");

const interaction = new DiscordInteractions({
    applicationId: clientId,
    authToken: token,
    publicKey,
});

const displayGlobalCommands = async () => {
    const globalCommands = await interaction.getApplicationCommands();
    console.log(globalCommands);
};

const displayGuildCommands = async () => {
    const guildCommands = await interaction.getApplicationCommands(guildId);
    console.log(guildCommands);
};

const guildCmdIds = ["866090784817020929", "919523921924075570"];

const deleteExtraGuildCommands = async () => {
    for (const cmdId of guildCmdIds) {
        await interaction.deleteApplicationCommand(cmdId, guildId);
    }
};

console.log("Global");
displayGlobalCommands();

console.log(`Guild: ${guildId}`);
displayGuildCommands(guildId);
