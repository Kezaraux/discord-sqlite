const store = require("../redux/store.js");
const { groupAdded, groupMemberAdded } = require("../redux/groupsSlice.js");
const groupQueries = require("../db/groupQueries.js");
const userQueries = require("../db/userQueries.js");
const combinedQueries = require("../db/combinedQueries.js");

module.exports = {
    name: "groupFeature",
    execute: async (client, logger) => {
        logger.info("Fetching stored groups and populating cache");
        await groupQueries.fetchAllGroups.each(async (err, row) => {
            if (err) return console.error(err);

            const groupObj = {
                id: row.messageID,
                guildId: row.guildID,
                channelID: row.channelID,
                title: row.title,
                size: row.size,
                datetime: row.eventtime,
                timezone: row.timezone,
                creatorID: row.ownerID,
                members: {},
                eventId: row.eventID
            };

            // Verify the message/channel/guild is still intact
            const guild = await client.guilds.cache.get(groupObj.guildId);

            if (!guild) {
                logger.info(
                    `Unable to resolve guild. Removing groups belonging to Guild ID ${groupObj.guildId} from the database.`
                );
                combinedQueries.removeGroupsByGuildId(groupObj.guildId);
                return;
            }

            const channel = await guild.channels.cache.get(groupObj.channelID);
            if (!channel) {
                logger.info(
                    `Unable to resolve channel. Removing groups belonging to channel ID ${groupObj.channelID} in Guild ID ${groupObj.guildId} from the database.`
                );
                combinedQueries.removeGroupsByChannelId(groupObj.channelID);
                return;
            }

            try {
                const fetchOptions = {
                    cache: true,
                    force: true
                };
                // We just want to try to fetch the message
                // If the message has been deleted this will throw an error
                await channel.messages.fetch(groupObj.id, fetchOptions);
            } catch (e) {
                logger.info(
                    `Unable to resolve message. Removing message ID ${groupObj.id} from the database.`
                );
                combinedQueries.removeGroupByGroupId(groupObj.id);
                return;
            }

            // The guild/channel/message still exists
            // Add this group to the store
            store.dispatch(groupAdded(groupObj));

            const group = row.messageID;
            logger.info(`Fetching members for ${group}`);
            userQueries.fetchAllUsersForGroup.each(
                group,
                (err, row) => {
                    if (err) return console.error(err);

                    store.dispatch(
                        groupMemberAdded({
                            id: group,
                            member: { id: row.userID, status: row.groupStatus }
                        })
                    );
                },
                (err, count) => {
                    logger.info(`Done handling a total of ${count} members for group ${group}`);
                }
            );
        });
    }
};

// Note to self, if we want to use fetchAllUsersForGroup or fetchAllGroups ANYWHERE else
// Remove the .finalize() calls
