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

module.exports = {
    addUserToGroup,
    updateUserStatus,
    removeUserFromGroup,
    removeAllUsersFromGroup,
    fetchAllUsersForGroup
};
