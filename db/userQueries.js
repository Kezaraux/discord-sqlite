const { db } = require("./db.js");

// addUserToGroup(userID, groupID, groupStatus)
const addUserToGroup = db.prepare("INSERT INTO users VALUES (?, ?, ?)");

// updateUserStatus(newStatus, userID, groupID)
const updateUserStatus = db.prepare(
    "UPDATE users SET groupStatus = ? WHERE userID = ? AND groupID = ?"
);

// removeUserFromGroup(userID, groupID)
const removeUserFromGroup = db.prepare("DELETE FROM users WHERE userID = ? AND groupID = ?");

// removeAllUsersFromGroup(groupID)
const removeAllUsersFromGroup = db.prepare("DELETE FROM users WHERE groupID = ?");

// fetchAllUsersForGroup(groupID)
const fetchAllUsersForGroup = db.prepare("SELECT * FROM users WHERE groupID = ?");

// removeAllUsersFromGroupsUnderGuild(guildID)
const removeAllUsersFromGroupsUnderGuild = db.prepare(
    "DELETE FROM users WHERE groupID IN (SELECT u.groupID FROM users u INNER JOIN groups g ON messageID=groupID WHERE guildID = ?)"
);

// removeAllUsersFromGroupsUnderChannel(channelID)
const removeAllUsersFromGroupsUnderChannel = db.prepare(
    "DELETE FROM users WHERE groupID IN (SELECT u.groupID FROM users u INNER JOIN groups g ON messageID=groupID WHERE channelID = ?)"
);

module.exports = {
    addUserToGroup,
    updateUserStatus,
    removeUserFromGroup,
    removeAllUsersFromGroup,
    fetchAllUsersForGroup,
    removeAllUsersFromGroupsUnderGuild,
    removeAllUsersFromGroupsUnderChannel
};
