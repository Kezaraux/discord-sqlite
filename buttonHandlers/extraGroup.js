const buttonCustomIds = require("../constants/buttonCustomIds");
const { groupsSelector, groupMemberAdded, groupMembersSet } = require("../redux/groupsSlice.js");
const store = require("../redux/store");
const { constructGroupEmbed, constructGroupButtons } = require("../helpers/messageComponents");
const userQueries = require("../db/userQueries.js");
const { userInGroupOfStatus, userInGroup } = require("../helpers/groupHelpers");
const groupStatus = require("../constants/groupStatus");

module.exports = {
    name: buttonCustomIds.EXTRA,
    execute: async ({ interaction, client, logger }) => {
        logger.info("Handling join group");
        const { message, member } = interaction;
        const group = groupsSelector.selectById(store.getState(), message.id);
        const currentMembers = group.members;

        // User is already in extra grouping
        if (userInGroupOfStatus(currentMembers, member.id, groupStatus.WAITING)) {
            console.log(group);
            console.log(group.members);
            logger.info(
                `Member with id ${member.id} tried to join a group with a status they already have.`
            );
            await interaction.reply({ content: "You're already in this group!", ephemeral: true });
            return;
        }

        if (userInGroup(currentMembers, member.id)) {
            // HANDLE EXISTING USER SWAPPING GROUPS
            const groupMembers = Object.keys(group.members);
            // Create new object since old one you couldn't overwrite properties
            const newMembers = groupMembers.reduce((acc, val) => {
                if (val === member.id) {
                    acc[val] = groupStatus.WAITING;
                } else {
                    acc[val] = group.members[val];
                }
                return acc;
            }, {});

            const groupObj = {
                ...group,
                members: newMembers
            };
            const newEmbed = await constructGroupEmbed(client, groupObj);
            const newButtons = constructGroupButtons();

            message.edit({ embeds: [newEmbed], components: newButtons }).then(async (newMsg) => {
                store.dispatch(
                    groupMembersSet({
                        id: group.id,
                        members: newMembers
                    })
                );

                userQueries.updateUserStatus.run(
                    groupStatus.WAITING,
                    member.id.toString(),
                    group.id.toString(),
                    (err) => {
                        if (err) return console.error(err);

                        interaction.reply({
                            content: "I've updated your status in the group!",
                            ephemeral: true
                        });
                        return;
                    }
                );
            });
        } else {
            // HANDLE A NEW USER JOINING GROUP
            const newMembers = {
                ...group.members,
                [member.id]: groupStatus.WAITING
            };

            const groupObj = {
                ...group,
                members: newMembers
            };
            const newEmbed = await constructGroupEmbed(client, groupObj);
            const newButtons = constructGroupButtons();

            message.edit({ embeds: [newEmbed], components: newButtons }).then(async (newMsg) => {
                store.dispatch(
                    groupMemberAdded({
                        id: group.id,
                        members: { id: member.id, status: groupStatus.WAITING }
                    })
                );

                userQueries.addUserToGroup.run(
                    member.id.toString(),
                    group.id.toString(),
                    groupStatus.WAITING,
                    (err) => {
                        if (err) return console.error(err);

                        interaction.reply({
                            content: "I've added you to the group!",
                            ephemeral: true
                        });
                        return;
                    }
                );
            });
        }
    }
};
