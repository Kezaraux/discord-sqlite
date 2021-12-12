const groupStatus = require("../constants/groupStatus.js");

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
            return true;
        default:
            //
            break;
    }
};

module.exports = {
    countStatusInGroup,
    userInGroup,
    userInGroupOfStatus,
    userCanSwapTo
};
