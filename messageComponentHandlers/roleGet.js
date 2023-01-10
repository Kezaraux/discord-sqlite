const messageComponentCustomIds = require("../constants/messageComponentCustomIds");
const {
    tryAssignRoleToMember,
    tryRemoveRoleFromMember,
    getRoleInGuild,
    doesMemberHaveRole,
} = require("../helpers/roleHelpers.js");

module.exports = {
    name: messageComponentCustomIds.ROLE_SELECT,
    execute: async ({ interaction, client, logger }) => {
        logger.info("Handling get role select menu");
        const { member, values, guild } = interaction;

        const [roleId] = values;
        const { name: roleName } = getRoleInGuild(guild, roleId);
        const hasRole = doesMemberHaveRole(member, roleId);
        let result;

        if (!hasRole) {
            result = await tryAssignRoleToMember(guild, roleId, member);
        } else {
            result = await tryRemoveRoleFromMember(guild, roleId, member);
        }

        if (result) {
            await interaction.update({
                content: `I've successfully ${hasRole ? "removed" : "added"} the role ${roleName} ${
                    hasRole ? "from" : "to"
                } you!`,
                ephemeral: true,
                components: [],
            });
        } else {
            logger.info(
                `Failed to ${hasRole ? "remove" : "add"} role ${roleId} to user ${
                    member.id
                } in guild ${guild.id}`,
            );
            await interaction.update({
                content: `I wasn't able to ${
                    hasRole ? "remove" : "add"
                } the role ${roleName} to you. Something may be wrong with my permissions.`,
                ephemeral: true,
                components: [],
            });
        }

        return;
    },
};
