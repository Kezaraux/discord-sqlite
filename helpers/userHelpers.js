const fetchUser = async (guild, userID) => {
    const member = await guild.members.fetch(userID);
    return member;
};

const getUserDisplayName = async (guild, userID) => {
    const member = await fetchUser(guild, userID);
    return member.displayName ?? "Fetch error";
};

module.exports = {
    fetchUser,
    getUserDisplayName,
};
