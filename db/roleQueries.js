const { db } = require("./db.js");

// addRole(guildID, roleID)
const addRole = db.prepare("INSERT INTO roles VALUES (?, ?)");

// removeRole(roleID)
const removeRole = db.prepare("DELETE FROM roles WHERE roleID = ?");

// removeAllRolesFromGuild(guildID)
const removeAllRolesFromGuild = db.prepare("DELETE FROM roles WHERE guildID = ?");

// fetchAllRolesForGuild(guildID)
const fetchAllRolesForGuild = db.prepare("SELECT * FROM roles WHERE guildID = ?");

// fetchAllRoles()
const fetchAllRoles = db.prepare("SELECT * FROM roles");

module.exports = {
    addRole,
    removeRole,
    removeAllRolesFromGuild,
    fetchAllRolesForGuild,
    fetchAllRoles,
};
