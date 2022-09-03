const store = require("../redux/store.js");
const { groupEventIdChanged } = require("../redux/groupsSlice.js");
const groupQueries = require("../db/groupQueries.js");

module.exports = {
    name: "guildScheduledEventDelete",
    once: false,
    execute: async ({ 0: scheduledEvent, client, logger }) => {
        console.log("GOT guildScheduledEventDelete EVENT");

        groupQueries.fetchGroupByEventID.get(scheduledEvent.id.toString(), async (err, row) => {
            if (err) return console.error(err);
            if (!row) return;

            groupQueries.removeEventIdFromGroups.run(scheduledEvent.id, err => {
                if (err) return console.error(err);

                store.dispatch(groupEventIdChanged({ id: row.messageID, value: null }));
                logger.info(`Removed event ${scheduledEvent.id} from database.`);
            });
        });
    },
};
