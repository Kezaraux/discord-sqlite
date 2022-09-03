module.exports = {
    name: "interactionCreate",
    once: false,
    execute: async ({ 0: interaction, client, logger }) => {
        if (!interaction.isCommand()) return;
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
