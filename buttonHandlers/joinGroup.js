const buttonCustomIds = require("../constants/buttonCustomIds");
const { groupsSelector, groupMemberAdded } = require("../redux/groupsSlice.js");
const store = require("../redux/store");
const groupStatus = require("../constants/groupStatus");
const {
    countStatusInGroup,
    userInGroupOfStatus,
    userInGroup,
    handleMessageAndStatusUpdates,
    userCanSwapTo
} = require("../helpers/groupHelpers");

module.exports = {
    name: buttonCustomIds.JOIN_GROUP,
    execute: async ({ interaction, client, logger }) => {
        logger.info("Handling join group");
        const { message, member, guild } = interaction;

        const group = groupsSelector.selectById(store.getState(), message.id);
        const currentMembers = group.members;

        // User is already in confirmed grouping
        if (userInGroupOfStatus(currentMembers, member.id, groupStatus.CONFIRMED)) {
            console.log(group);
            console.log(group.members);
            logger.info(
                `Member with id ${member.id} tried to join a group with a status they already have.`
            );
            await interaction.reply({ content: "You're already in this group!", ephemeral: true });
            return;
        }

        const confirmedCount = countStatusInGroup(group, groupStatus.CONFIRMED);

        const statusToAdd =
            confirmedCount === group.size ? groupStatus.WAITING : groupStatus.CONFIRMED;

        // HANDLE USER IN WAITING OR UNCERTAIN
        if (userInGroup(currentMembers, member.id)) {
            if (!userCanSwapTo(group, member.id, statusToAdd)) {
                console.log(group);
                logger.info(
                    `Member with id ${member.id} tried to join a full group when they are already waiting.`
                );
                await interaction.reply({
                    content: `The group is full, and you're already in the ${groupStatus.WAITING} column!`,
                    ephemeral: true
                });
                return;
            }

            const groupMembers = Object.keys(group.members);
            const newMembers = groupMembers.reduce((acc, val) => {
                if (val === member.id) {
                    acc[val] = statusToAdd;
                } else {
                    acc[val] = group.members[val];
                }
                return acc;
            }, {});

            const groupObj = {
                ...group,
                members: newMembers
            };

            await handleMessageAndStatusUpdates(interaction, groupObj, statusToAdd, false);
        } else {
            // HANDLE USER NOT IN GROUP
            const groupObj = {
                ...group,
                members: {
                    ...group.members,
                    [member.id]: statusToAdd
                }
            };

            await handleMessageAndStatusUpdates(interaction, groupObj, statusToAdd, true);
        }
    }
};
