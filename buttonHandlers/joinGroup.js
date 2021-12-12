const buttonCustomIds = require("../constants/buttonCustomIds");
const { groupsSelector, groupMemberAdded } = require("../redux/groupsSlice.js");
const store = require("../redux/store");
const { constructGroupEmbed, constructGroupButtons } = require("../helpers/messageComponents");
const userQueries = require("../db/userQueries.js");
const groupStatus = require("../constants/groupStatus");
const { countStatusInGroup, userInGroupOfStatus, userInGroup } = require("../helpers/groupHelpers");

module.exports = {
    name: buttonCustomIds.JOIN_GROUP,
    execute: async ({ interaction, client, logger }) => {
        logger.info("Handling join group");
        const { message, member, guild } = interaction;

        console.log(message.id);
        console.log(store.getState());

        const group = groupsSelector.selectById(store.getState(), message.id);
        console.log(group);
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

        // // User is NOT in confirmed group and confirmed is full
        // // POTENTIALLY THROW THEM IN EXTRA
        // const confirmedCount = countStatusInGroup(currentMembers, groupStatus.CONFIRMED);
        // if (confirmedCount >= group.size) {
        //     logger.info(``);
        //     await interaction.reply({
        //         content: "",
        //         ephemeral: true
        //     });
        //     return;
        // }

        const confirmedCount = countStatusInGroup(group, groupStatus.CONFIRMED);

        let statusToAdd;
        if (confirmedCount === group.size) {
            statusToAdd = groupStatus.WAITING;
        } else {
            statusToAdd = groupStatus.CONFIRMED;
        }

        const newMembers = {
            ...group.members,
            [member.id]: statusToAdd
        };

        const groupObj = {
            ...group,
            members: newMembers
        };

        const newEmbed = await constructGroupEmbed(guild, groupObj);
        const newButtons = constructGroupButtons();

        message.edit({ embeds: [newEmbed], components: newButtons }).then(async (newMsg) => {
            store.dispatch(
                groupMemberAdded({
                    id: group.id,
                    member: { id: member.id, status: statusToAdd }
                })
            );

            if (userInGroup(currentMembers, member.id)) {
                userQueries.updateUserStatus.run(
                    statusToAdd,
                    member.id.toString(),
                    group.id.toString(),
                    (err) => {
                        if (err) return console.error(err);

                        interaction.reply({
                            content: "I've updated your status in the group!",
                            ephemeral: true
                        });
                    }
                );
            } else {
                userQueries.addUserToGroup.run(
                    member.id.toString(),
                    group.id.toString(),
                    statusToAdd,
                    (err) => {
                        if (err) return console.error(err);

                        interaction.reply({
                            content: "I've added you to the group!",
                            ephemeral: true
                        });
                    }
                );
            }
        });
    }
};
