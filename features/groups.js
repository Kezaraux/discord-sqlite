const momentTimezone = require("moment-timezone");
require("moment-parseplus");

const store = require("../redux/store.js");
const { groupAdded, groupMemberAdded } = require("../redux/groupsSlice.js");
const groupQueries = require("../db/groupQueries.js");
const userQueries = require("../db/userQueries.js");
const combinedQueries = require("../db/combinedQueries.js");
const { constructAcknowledgeButton } = require("../helpers/messageComponents.js");
const { removeGroupWithMessage } = require("../helpers/groupHelpers");

module.exports = {
    name: "groupFeature",
    execute: async (client, logger) => {
        logger.info("Fetching stored groups and populating cache");
        await groupQueries.fetchAllGroups.each(async (err, row) => {
            if (err) return console.error(err);

            const groupObj = {
                id: row.messageID,
                guildID: row.guildID,
                channelID: row.channelID,
                title: row.title,
                size: row.size,
                datetime: row.eventtime,
                timezone: row.timezone,
                creatorID: row.ownerID,
                members: {},
                eventID: row.eventID,
            };

            // Verify the message/channel/guild is still intact
            const guild = await client.guilds.cache.get(groupObj.guildID);

            if (!guild) {
                logger.info(
                    `Unable to resolve guild. Removing groups belonging to Guild ID ${groupObj.guildID} from the database.`,
                );
                combinedQueries.removeGroupsByGuildId(groupObj.guildID);
                return;
            }

            const channel = await guild.channels.cache.get(groupObj.channelID);
            if (!channel) {
                logger.info(
                    `Unable to resolve channel. Removing groups belonging to channel ID ${groupObj.channelID} in Guild ID ${groupObj.guildID} from the database.`,
                );
                combinedQueries.removeGroupsByChannelId(groupObj.channelID);
                return;
            }

            try {
                const fetchOptions = {
                    cache: true,
                    force: true,
                };
                // We just want to try to fetch the message
                // If the message has been deleted this will throw an error
                await channel.messages.fetch(groupObj.id, fetchOptions);
            } catch (e) {
                logger.info(
                    `Unable to resolve message. Removing message ID ${groupObj.id} from the database.`,
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
                            member: { id: row.userID, status: row.groupStatus },
                        }),
                    );
                },
                (err, count) => {
                    logger.info(`Done handling a total of ${count} members for group ${group}`);
                },
            );

            logger.info(`Checking event time for group ${group}`);
            const groupTime = momentTimezone.tz(groupObj.datetime, groupObj.timezone);
            if (momentTimezone.tz(groupObj.timezone).isAfter(groupTime)) {
                logger.info(
                    `Group with id ${group} event time is before now, it potentially hasn't been removed`,
                );
                const message = await channel.messages.fetch(groupObj.id, {
                    cache: true,
                    force: true,
                });

                await removeGroupWithMessage(message);
            } else {
                logger.info(
                    `Group with id ${group} event time is after now, no need to alert the owner.`,
                );
            }
        });
    },
};

// Note to self, if we want to use fetchAllUsersForGroup or fetchAllGroups ANYWHERE else
// Remove the .finalize() calls
