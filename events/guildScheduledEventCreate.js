module.exports = {
    name: "guildScheduledEventCreate",
    once: false,
    execute: async ({ 0: scheduledEvent, client, logger }) => {
        console.log("GOT guildScheduledEventCreate EVENT");
    }
};
