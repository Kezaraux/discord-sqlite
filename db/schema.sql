CREATE TABLE IF NOT EXISTS groups(
    messageID TEXT NOT NULL,
    channelID TEXT NOT NULL,
    guildID TEXT NOT NULL,
    title TEXT NOT NULL,
    size INTEGER NOT NULL,
    eventtime DATETIME NOT NULL,
    timezone TEXT NOT NULL DEFAULT 'America/Toronto',
    ownerID TEXT NOT NULL,
    eventID TEXT UNIQUE,
    PRIMARY KEY (messageID)
);

CREATE TABLE IF NOT EXISTS users(
    userID TEXT NOT NULL,
    groupID TEXT NOT NULL,
    groupStatus TEXT NOT NULL,
    PRIMARY KEY (userID, groupID),
    FOREIGN KEY (groupID) REFERENCES groups (messageID)
);

CREATE TABLE IF NOT EXISTS roles(
    guildID TEXT NOT NULL,
    roleID TEXT NOT NULL,
    PRIMARY KEY (roleID)
);