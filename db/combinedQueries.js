const userQueries = require("./userQueries.js");
const groupQueries = require("./groupQueries.js");

const removeGroupByGroupId = groupId => {
    userQueries.removeAllUsersFromGroup.run(groupId, err => {
        if (err) console.error(err);
    });
    groupQueries.removeGroup.run(groupId, err => {
        if (err) console.error(err);
    });
};

const removeGroupsByGuildId = guildID => {
    userQueries.removeAllUsersFromGroupsUnderGuild.run(guildID, err => {
        if (err) console.error(err);
    });
    groupQueries.removeAllUsersFromGroupsUnderGuild.run(guildID, err => {
        if (err) console.error(err);
    });
};

const removeGroupsByChannelId = channelID => {
    userQueries.removeAllUsersFromGroupsUnderChannel.run(channelID, err => {
        if (err) console.error(err);
    });
    groupQueries.removeAllUsersFromGroupsUnderChannel.run(channelID, err => {
        if (err) console.error(err);
    });
};

module.exports = {
    removeGroupByGroupId,
    removeGroupsByGuildId,
    removeGroupsByChannelId,
};
