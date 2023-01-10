const {
    PermissionsBitField,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    Guild,
    GuildMember,
    Role,
} = require("discord.js");

const store = require("../redux/store.js");
const messageComponentCustomIds = require("../constants/messageComponentCustomIds.js");

/**
 *
 * @param {Guild} guild The guild to check permissions in
 * @returns {Boolean} True if the bot has permission to manage roles, false otherwise
 */
const canBotManageRoles = guild => {
    const botMember = guild.members.me;
    return botMember.permissions.has(PermissionsBitField.Flags.ManageRoles);
};

/**
 *
 * @param {GuildMember} member The guild member to check permissions on
 * @returns {Boolean} True if the member has permission to manage roles, false otherwise
 */
const canMemberManageRoles = member =>
    member.permissions.has(PermissionsBitField.Flags.ManageRoles);

/**
 *
 * @param {Guild} guild The guild to find the role in
 * @param {String} roleId The ID of the role
 * @returns {Role} The role object indicated by the roleId in the provided guild
 */
const getRoleInGuild = (guild, roleId) => guild.roles.cache.find(r => r.id === roleId);

/**
 *
 * @param {Guild} guild The guild to check roles in
 * @param {String} roleId The ID of the role to check against
 * @returns {Boolean} True if the bot can assign the role, false otherwise
 */
const botCanAssignRole = (guild, roleId) => {
    const botMember = guild.members.me;
    const botsHighestRole = botMember.roles.highest;
    const roleToAssign = getRoleInGuild(guild, roleId);
    const rolePositionDiff = guild.roles.comparePositions(botsHighestRole, roleToAssign);
    return rolePositionDiff > 0;
};

/**
 *
 * @param {GuildMember} member
 * @param {String} roleId
 * @returns {Boolean} True if the member has the role, false otherwise
 */
const doesMemberHaveRole = (member, roleId) => member.roles.cache.has(roleId);

/**
 *
 * @async
 * @param {Guild} guild The guild to manage roles in
 * @param {String} roleId The ID of the role to add
 * @param {GuildMember} member The GuildMember to add the role to
 * @returns {Boolean} Returns true if the role was successfully added, false otherwise
 */
const tryAssignRoleToMember = async (guild, roleId, member) => {
    if (!botCanAssignRole(guild, roleId)) {
        console.log("Bot cannot assign role");
        return false;
    }
    if (doesMemberHaveRole(member, roleId)) {
        console.log("Member has role");
        return false;
    }

    await member.roles.add(roleId);
    return true;
};

/**
 *
 * @async
 * @param {Guild} guild
 * @param {String} roleId
 * @param {GuildMember} member
 * @returns {Boolean} Returns true if the role was successfully removed, false otherwise
 */
const tryRemoveRoleFromMember = async (guild, roleId, member) => {
    if (!botCanAssignRole(guild, roleId)) {
        return false;
    }
    if (!doesMemberHaveRole(member, roleId)) {
        return false;
    }

    await member.roles.remove(roleId);
    return true;
};

/**
 *
 * @param {Guild} guild The guild object which contains the roles for the message.
 * @returns {BaseMessageOptions} Returns an object containing the message options for the role message.
 */
const constructRoleGetMessage = guild => {
    const roleState = store.getState().roles;
    const { id: guildId } = guild;
    const rolesForGuild = roleState.ids.reduce((acc, roleId) => {
        if (roleState.entities[roleId].guildId === guildId) {
            const role = getRoleInGuild(guild, roleId);
            acc.push({ value: role.id, label: role.name });
        }
        return acc;
    }, []);

    if (rolesForGuild.length === 0) {
        return { content: "No roles have been set up for this server.", ephemeral: true };
    }

    const row = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId(messageComponentCustomIds.ROLE_SELECT)
            .setPlaceholder("Select a role you want to have assigned/removed.")
            .addOptions(...rolesForGuild),
    );

    return { content: "\u200b", components: [row], ephemeral: true };
};

module.exports = {
    doesMemberHaveRole,
    canMemberManageRoles,
    canBotManageRoles,
    botCanAssignRole,
    tryAssignRoleToMember,
    tryRemoveRoleFromMember,
    constructRoleGetMessage,
    getRoleInGuild,
};
