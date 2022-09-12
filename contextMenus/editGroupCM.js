const { ContextMenuCommandBuilder, ApplicationCommandType } = require("discord.js");

const store = require("../redux/store.js");
const { groupsSelector } = require("../redux/groupsSlice.js");
const { constructEditGroupModal } = require("../modals/editGroupModal");

module.exports = {
    data: new ContextMenuCommandBuilder()
        .setName("Edit group")
        .setType(ApplicationCommandType.Message),
    execute: async (interaction, logger) => {
        logger.info("Handling edit group context menu command");

        const { targetMessage, user } = interaction;
        const { id: messageId } = targetMessage;
        const { id: userId } = user;

        const groupObj = groupsSelector.selectById(store.getState(), messageId);

        // Check that a group exists
        if (!groupObj) {
            await interaction.reply({
                content: `I could not find a group associated with that message. Are you trying to edit a group that has been set inactive?`,
                ephemeral: true,
            });
            return;
        }

        // Check that the user who sent this interaction owns the group
        if (userId !== groupObj.creatorID) {
            interaction.reply({
                content:
                    "You cannot edit this group since you didn't create it. Please get the group owner to perform any edits.",
                ephemeral: true,
            });
            return;
        }

        const modal = constructEditGroupModal(messageId);
        await interaction.showModal(modal);
    },
};
