const { db } = require("./db.js");

// createGroup(msgId, chnlId, guildId, title, size, when, timezone, ownerId)
const createGroup = db.prepare("INSERT INTO groups VALUES (?, ?, ?, ?, ?, ?, ?, ?)");

// updateGroupTitle(msgId, newTitle)
const updateGroupTitle = db.prepare("UPDATE groups SET title = ? WHERE messageID = ?");

// updateGroupSize(msgId, newSize)
const updateGroupSize = db.prepare("UPDATE groups SET size = ? WHERE messageID = ?");

// updateGroupEventTime(msgId, newDatetime)
const updateGroupEventTime = db.prepare("UPDATE groups SET eventtime = ? WHERE messageID = ?");

// updateGroupTimezone(msgId, newTimezone)
const updateGroupTimezone = db.prepare("UPDATE groups SET timezone = ? WHERE messageID = ?");

// removeGroup(messageId)
const removeGroup = db.prepare("DELETE FROM groups WHERE messageID = ?");

// fetchAllGroups()
const fetchAllGroups = db.prepare("SELECT * FROM groups");

module.exports = {
    createGroup,
    updateGroupTitle,
    updateGroupSize,
    updateGroupEventTime,
    updateGroupTimezone,
    removeGroup,
    fetchAllGroups
};
