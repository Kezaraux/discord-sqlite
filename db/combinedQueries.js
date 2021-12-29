const userQueries = require("./userQueries.js");
const groupQueries = require("./groupQueries.js");

const removeGroupByGroupId = (groupId) => {
    userQueries.removeAllUsersFromGroup.run(groupId, (err) => {
        if (err) console.error(err);
    });
    groupQueries.removeGroup.run(groupId, (err) => {
        if (err) console.error(err);
    });
};

const removeGroupsByGuildId = (guildId) => {
    userQueries.removeAllUsersFromGroupsUnderGuild.run(guildId, (err) => {
        if (err) console.error(err);
    });
    groupQueries.removeAllUsersFromGroupsUnderGuild.run(guildId, (err) => {
        if (err) console.error(err);
    });
};

const removeGroupsByChannelId = (channelId) => {
    userQueries.removeAllUsersFromGroupsUnderChannel.run(channelId, (err) => {
        if (err) console.error(err);
    });
    groupQueries.removeAllUsersFromGroupsUnderChannel.run(channelId, (err) => {
        if (err) console.error(err);
    });
};

module.exports = {
    removeGroupByGroupId,
    removeGroupsByGuildId,
    removeGroupsByChannelId
};
