const buttonCustomIds = require("../constants/buttonCustomIds");
const editSubCommands = require("../constants/editSubCommands");
const store = require("../redux/store.js");
const { groupsSelector } = require("../redux/groupsSlice.js");
const {
    handleTitle,
    handleSize,
    handleDatetime,
    handleTimezone,
} = require("../helpers/editCommandHelpers");

module.exports = {
    name: buttonCustomIds.EDIT_MODAL,
    execute: async ({ interaction, client, logger }) => {
        logger.info("Handling edit group modal submit");

        const groupId = interaction.fields.getTextInputValue(buttonCustomIds.EDIT_GROUPID);
        const property = interaction.fields
            .getTextInputValue(buttonCustomIds.EDIT_SELECT)
            .toLowerCase();
        const newValue = interaction.fields.getTextInputValue(buttonCustomIds.EDIT_VALUE);

        const groupObj = groupsSelector.selectById(store.getState(), groupId);
        if (!groupObj) {
            await interaction.reply({
                content: `Did you edit the group id? I could not find a group for the group id provided.`,
                ephemeral: true,
            });
            return;
        }

        switch (property) {
            case editSubCommands.TITLE:
                handleTitle(interaction, newValue, groupObj);
                break;
            case editSubCommands.SIZE:
                handleSize(interaction, newValue, groupObj);
                break;
            case editSubCommands.WHEN:
                handleDatetime(interaction, newValue, groupObj);
                break;
            case editSubCommands.TIMEZONE:
                handleTimezone(interaction, newValue, groupObj);
                break;
            default:
                await interaction.reply({
                    content: `The property to edit must be one of: ${Object.values(
                        editSubCommands,
                    ).join(", ")}. Please try again.`,
                    ephemeral: true,
                });
                return;
        }

        return;
    },
};
