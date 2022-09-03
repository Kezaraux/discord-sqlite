module.exports = {
    name: "guildScheduledEventUserAdd",
    once: false,
    execute: async ({ 0: scheduledEvent, 1: user, client, logger }) => {
        console.log("GOT guildScheduledEventUserAdd EVENT");
    },
};

// NOTE: Currently not receiving this event
