const { db } = require("./db.js");

// createGroup(msgId, chnlId, guildId, title, size, when, timezone, ownerId, eventId)
const createGroup = db.prepare("INSERT INTO groups VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");

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

// removeGroupsUnderGuild(guildID)
const removeGroupsUnderGuild = db.prepare("DELETE FROM groups WHERE guildID = ?");

// removeGroupsUnderChannel(channelID)
const removeGroupsUnderChannel = db.prepare("DELETE FROM groups WHERE channelID = ?");

// fetchGroupByEventId(eventID)
const fetchGroupByEventID = db.prepare("SELECT * FROM groups WHERE eventID = ?");

// removeEventIdFromGroups(eventID)
const removeEventIdFromGroups = db.prepare("UPDATE groups SET eventID = null WHERE eventID = ?");

module.exports = {
    createGroup,
    updateGroupTitle,
    updateGroupSize,
    updateGroupEventTime,
    updateGroupTimezone,
    removeGroup,
    fetchAllGroups,
    removeGroupsUnderGuild,
    removeGroupsUnderChannel,
    fetchGroupByEventID,
    removeEventIdFromGroups,
};
