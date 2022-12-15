const groupStatus = require("../constants/groupStatus.js");
const userQueries = require("../db/userQueries.js");
const combinedQueries = require("../db/combinedQueries.js");
const { constructGroupMessage } = require("./messageComponents");
const store = require("../redux/store.js");
const { groupMembersSet, groupsSelector, groupRemoved } = require("../redux/groupsSlice.js");

const countStatusInGroup = (group, statusType) => {
    let count = 0;
    for (const member in group.members) {
        if (group.members[member] === statusType) {
            count++;
        }
    }
    return count;
};

const userInGroup = (members, userID) => {
    return Object.keys(members).includes(userID.toString());
};

const userInGroupOfStatus = (members, userID, statusType) => {
    if (!userInGroup(members, userID)) return false;

    return members[userID] == statusType;
};

const userCanSwapTo = (group, userID, swapToStatus) => {
    if (!userInGroup(group.members, userID)) return false;

    switch (swapToStatus) {
        case groupStatus.CONFIRMED:
            const confirmedCount = countStatusInGroup(group, groupStatus.CONFIRMED);
            if (confirmedCount < group.size) {
                return true;
            } else {
                return false;
            }
        case groupStatus.UNKNOWN:
        case groupStatus.WAITING:
            return !userInGroupOfStatus(group.members, userID, swapToStatus);
        default:
            return false;
    }
};

const handleMessageAndStatusUpdates = async (
    interaction,
    groupObj,
    statusToAdd,
    adding,
    active = true,
) => {
    const newMessage = await constructGroupMessage(interaction.guild, groupObj, active);
    interaction.message.edit(newMessage).then(async newMsg => {
        store.dispatch(
            groupMembersSet({
                id: groupObj.id,
                members: groupObj.members,
            }),
        );

        if (adding) {
            userQueries.addUserToGroup.run(
                interaction.member.id.toString(),
                groupObj.id.toString(),
                statusToAdd,
                err => {
                    if (err) return console.error(err);

                    interaction.reply({
                        content: "I've added you to the group!",
                        ephemeral: true,
                    });
                },
            );
        } else {
            userQueries.updateUserStatus.run(
                statusToAdd,
                interaction.member.id.toString(),
                groupObj.id.toString(),
                err => {
                    if (err) return console.error(err);

                    interaction.reply({
                        content: "I've updated your status in the group!",
                        ephemeral: true,
                    });
                    return;
                },
            );
        }
    });
};

/**
 *
 * @param {Message} message     The Discord message object that represents the group
 * @returns {{success: Boolean, message: String}}   Success indicates if the group was removed successfully,
 *                                                  and message has extra information
 */
const removeGroupWithMessage = async message => {
    const groupId = message.id;
    const guild = message.guild;
    const group = groupsSelector.selectById(store.getState(), groupId);

    const returnStatus = { success: true, message: "" };

    if (!group) {
        logger.info(`There is no group for message of ID: ${groupId}`);
        returnStatus.success = false;
        returnStatus.message =
            "I don't have a group for this message in my database. Something weird must have happened. Please delete the associated message.";
        return returnStatus;
    }

    store.dispatch(groupRemoved({ id: message.id }));
    combinedQueries.removeGroupByGroupId(group.id);

    if (group.eventID) {
        const guildEvent = await guild.scheduledEvents.fetch(group.eventID);
        guildEvent
            .delete()
            .then(() => {
                console.log(`Deleted the event ${group.eventID} for group ${group.id}`);
            })
            .catch(console.error);
    }

    const newMessage = await constructGroupMessage(guild, group, false);

    try {
        const updatedMessage = await message.edit(newMessage);
        if (updatedMessage) {
            console.log(`Successfully removed group and edited message for group ${message.id}`);
            returnStatus.success = true;
            returnStatus.message =
                "I've removed the group! Consider replying to the group message with a reason for it is no longer active.";
        }
    } catch (err) {
        console.log(`Something went wrong when editing the message for group ${message.id}`);
        console.error(err);
        returnStatus.success = true;
        returnStatus.message =
            "Something went wrong when I tried to edit the group message. The group has been removed, please delete the message.";
    }

    return returnStatus;
};

module.exports = {
    countStatusInGroup,
    userInGroup,
    userInGroupOfStatus,
    userCanSwapTo,
    handleMessageAndStatusUpdates,
    removeGroupWithMessage,
};
