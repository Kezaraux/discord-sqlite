const { InteractionType } = require("discord.js");

module.exports = {
    name: "interactionCreate",
    once: false,
    execute: async ({ 0: interaction, client, logger }) => {
        // Handles both commands and context menu commands
        if (interaction.type !== InteractionType.ApplicationCommand) return;
        logger.info("Handling a command");

        const { commandName } = interaction;
        if (!client.commands.has(commandName)) return;

        const command = client.commands.get(commandName);
        try {
            await command.execute(interaction, logger);
        } catch (error) {
            console.error(error);
        }
    },
};
