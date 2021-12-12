const fetchUser = async (client, userID, guildID) => {
    const guild = await client.guilds.resolve(guildID);
    const member = await guild.members.resolve(userID);
    return member;
};

const getUserDisplayName = async (client, userID, guildID) => {
    const member = await fetchUser(client, userID, guildID);
    return member.displayName;
};

module.exports = {
    fetchUser,
    getUserDisplayName
};
