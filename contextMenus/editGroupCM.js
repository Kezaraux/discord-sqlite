const { ContextMenuCommandBuilder, ApplicationCommandType } = require("discord.js");

const store = require("../redux/store.js");
const { groupsSelector } = require("../redux/groupsSlice.js");
const { constructEditGroupModal } = require("../modals/editGroupModal");

module.exports = {
    disabled: false,
    devOnly: false,
    data: new ContextMenuCommandBuilder()
        .setName("Edit group")
        .setType(ApplicationCommandType.Message),
    execute: async (interaction, logger) => {
        logger.info("Handling edit group context menu command");

        const { targetMessage, member } = interaction;
        const { id: messageId } = targetMessage;

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
        if (
            member.id !== groupObj.creatorID &&
            !member.permissionsIn(message.channel).has(PermissionsBitField.Flags.ManageMessages)
        ) {
            interaction.reply({
                content: `The group can only be edited if:
            1) The group creator requests it
            2) You have permissions to manage messages in this channel`,
                ephemeral: true,
            });
            return;
        }

        const modal = constructEditGroupModal(messageId);
        await interaction.showModal(modal);
    },
};
