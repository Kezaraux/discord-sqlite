const store = require("../redux/store.js");
const { roleAdded } = require("../redux/rolesSlice.js");
const roleQueries = require("../db/roleQueries.js");

module.exports = {
    name: "roleFeature",
    execute: async (client, logger) => {
        logger.info("Fetching stored roles and populating cache");
        await roleQueries.fetchAllRoles.each(async (err, row) => {
            if (err) return console.error(err);

            const roleObj = {
                roleId: row.roleID,
                guildId: row.guildID,
            };

            const guild = await client.guilds.cache.get(roleObj.guildId);

            if (!guild) {
                logger.info(
                    `Unable to resolve guild. Removing roles belonging to Guild ID ${roleObj.guildId} from the database.`,
                );
                roleQueries.removeAllRolesFromGuild(roleObj.guildID);
                return;
            }

            try {
                const fetchOptions = {
                    cache: true,
                    force: true,
                };
                // We just want to try to fetch the role
                // If the role has been deleted this might throw an error
                const result = await guild.roles.fetch(roleObj.roleId, fetchOptions);
                if (!result) {
                    logger.info(
                        `Unable to resolve the role. Removing role ID ${roleObj.roleId} from the database.`,
                    );
                    roleQueries.removeRole.run(roleObj.roleId);
                    return;
                }
            } catch (e) {
                logger.info(
                    `Unable to resolve the role. Removing role ID ${roleObj.roleId} from the database.`,
                );
                roleQueries.removeRole.run(roleObj.roleId);
                return;
            }

            logger.info(
                `Added role with ID ${roleObj.roleId} for guild with ID ${roleObj.guildId}`,
            );
            store.dispatch(roleAdded(roleObj));
        });
    },
};
