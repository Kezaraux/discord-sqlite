const groupStatus = require("../constants/groupStatus.js");
const userQueries = require("../db/userQueries.js");
const { constructGroupEmbed, constructGroupButtons } = require("./messageComponents");
const store = require("../redux/store.js");
const { groupMembersSet } = require("../redux/groupsSlice.js");

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

const handleMessageAndStatusUpdates = async (interaction, groupObj, statusToAdd, adding) => {
    const newEmbed = await constructGroupEmbed(interaction.guild, groupObj);
    const newButtons = constructGroupButtons();

    interaction.message
        .edit({ embeds: [newEmbed], components: newButtons })
        .then(async (newMsg) => {
            store.dispatch(
                groupMembersSet({
                    id: groupObj.id,
                    members: groupObj.members
                })
            );

            if (adding) {
                userQueries.addUserToGroup.run(
                    interaction.member.id.toString(),
                    groupObj.id.toString(),
                    statusToAdd,
                    (err) => {
                        if (err) return console.error(err);

                        interaction.reply({
                            content: "I've added you to the group!",
                            ephemeral: true
                        });
                    }
                );
            } else {
                userQueries.updateUserStatus.run(
                    statusToAdd,
                    interaction.member.id.toString(),
                    groupObj.id.toString(),
                    (err) => {
                        if (err) return console.error(err);

                        interaction.reply({
                            content: "I've updated your status in the group!",
                            ephemeral: true
                        });
                        return;
                    }
                );
            }
        });
};

module.exports = {
    countStatusInGroup,
    userInGroup,
    userInGroupOfStatus,
    userCanSwapTo,
    handleMessageAndStatusUpdates
};
