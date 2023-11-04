const handleError = async (error, interaction, logger) => {
    const { code } = error;
    const { commandName } = interaction;

    logger.error(`Encountered an error while handling ${commandName}, error code ${code}.`);
    console.error(error);

    switch (code) {
        case 50001:
            await handleMissingPerms(interaction, logger);
            break;
        default:
            await interaction.reply({
                content: `I encountered an error when handling the command ${commandName}. If this continues to happen reach out to the bot owner.`,
                ephemeral: true,
            });
    }
};

const handleMissingPerms = async (interaction, logger) => {
    const { channel, guild, appPermissions } = interaction;
    // Use https://discordlookup.com/permissions-calculator to read the appPermissions
    logger.info(
        `Missing permissions in ${channel.name} in ${guild.name}. App permissions are: ${appPermissions}`,
    );
    await interaction.reply({
        content:
            "I don't have permissions to perform part or all of the command. Reach out to a server admin for help.",
        ephemeral: true,
    });
};

module.exports = {
    handleError,
};
