const buttonCustomIds = require("../constants/buttonCustomIds");

module.exports = {
    name: buttonCustomIds.ACKNOWLEDGE,
    execute: async ({ interaction, client, logger }) => {
        logger.info("Handling acknowledge button");
        const { message, member } = interaction;

        const intendedRecipient = message.mentions.members.firstKey();
        if (member.id !== intendedRecipient) {
            logger.info(
                `${member.id} clicked the acknowledge button intended for ${intendedRecipient}`,
            );
            interaction.reply({
                content: `This message was intended for ${
                    message.mentions.members.first().displayName
                }. If you would like this message to be removed, please have the mentioned user click the acknowledge button, or an admin delete the message.`,
                ephemeral: true,
            });
            return;
        }

        interaction.reply({
            content: `Thank you for acknowledging this message ${
                message.mentions.members.first().displayName
            }!`,
            ephemeral: true,
        });

        message.delete();
    },
};
