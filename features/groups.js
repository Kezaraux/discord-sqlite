const store = require("../redux/store.js");
const { groupAdded, groupMemberAdded } = require("../redux/groupsSlice.js");
const groupQueries = require("../db/groupQueries.js");
const userQueries = require("../db/userQueries.js");

module.exports = {
    execute: async (client, logger) => {
        logger.info("Fetching stored groups and populating cache");
        const groupList = [];
        await groupQueries.fetchAllGroups.each(
            (err, row) => {
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
                    members: {}
                };
                store.dispatch(groupAdded(groupObj));
                groupList.push(row.messageID);
            },
            (err, count) => {
                groupQueries.fetchAllGroups.finalize();

                logger.info(
                    `Retrieved a total of ${count} groups. Starting to fetch their members.`
                );

                for (const group of groupList) {
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
                            logger.info(
                                `Done handling a total of ${count} members for group ${group}`
                            );
                        }
                    );
                }
                userQueries.fetchAllUsersForGroup.finalize();
            }
        );
    }
};
