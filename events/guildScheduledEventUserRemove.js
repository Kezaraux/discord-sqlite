module.exports = {
    name: "guildScheduledEventUserRemove",
    once: false,
    execute: async ({ 0: scheduledEvent, 1: user, client, logger }) => {
        console.log("GOT guildScheduledEventUserRemove EVENT");
    }
};

// NOTE: Currently not receiving this event
