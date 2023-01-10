const { InteractionType } = require("discord.js");

module.exports = {
    name: "interactionCreate",
    once: false,
    execute: async ({ 0: interaction, client, logger }) => {
        if (interaction.type !== InteractionType.MessageComponent) return;
        logger.info("Handling a button");

        const { customId } = interaction;
        if (!client.messageComponentHandlers.has(customId)) {
            logger.info(`Unknown message component interaction with custom id: ${customId}`);
            interaction.reply({
                content: "Sorry, I didn't know how to respond to this interaction!",
                ephemeral: true,
            });
            return;
        }

        const handler = client.messageComponentHandlers.get(customId);

        try {
            await handler.execute({ interaction, client, logger });
        } catch (error) {
            console.error(error);
        }
    },
};
