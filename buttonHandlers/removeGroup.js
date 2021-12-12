const buttonCustomIds = require("../constants/buttonCustomIds");
const permissions = require("../constants/permissions");
const { groupsSelector, groupRemoved } = require("../redux/groupsSlice.js");
const store = require("../redux/store");
const groupQueries = require("../db/groupQueries.js");
const userQueries = require("../db/userQueries.js");

module.exports = {
    name: buttonCustomIds.REMOVE_GROUP,
    execute: async ({ interaction, client, logger }) => {
        logger.info("Handling delete group");
        const { message, member } = interaction;
        const group = groupsSelector.selectById(store.getState(), message.id);

        if (
            member.id === group.creatorID ||
            member.permissionsIn(message.channel).has(permissions.MANAGE_MESSAGES)
        ) {
            const bot = await interaction.guild.members.fetch(client.user.id);
            const botHasPermission = bot
                .permissionsIn(message.channel)
                .has(permissions.MANAGE_MESSAGES);
            if (botHasPermission) {
                logger.info(`Deleting message with id ${message.id}`);

                store.dispatch(groupRemoved({ id: message.id }));
                userQueries.removeAllUsersFromGroup.run(group.id);
                groupQueries.removeGroup.run(group.id);

                message.delete();

                interaction.reply({ content: "I've removed the group!", ephemeral: true });
            } else {
                logger.info(
                    `Could not delete message with id ${interaction.message.id} due to lacking permissions`
                );
                interaction.reply({
                    content:
                        "I can't remove the group since I lack the permissions to manage messages!",
                    ephemeral: true
                });
            }
        } else {
            interaction.reply({
                content:
                    "The group can only be removed if: the group creator requests it, or you have permission to manage messages in this channel.",
                ephemeral: true
            });
            return;
        }
    }
};
