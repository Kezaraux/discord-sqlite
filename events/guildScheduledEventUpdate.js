const _ = require("lodash");

const store = require("../redux/store.js");
const { groupsSelector, groupRemoved } = require("../redux/groupsSlice.js");
const { text_status } = require("../constants/scheduledEventConstants.js");
const groupQueries = require("../db/groupQueries.js");
const combinedQueries = require("../db/combinedQueries.js");
const { constructGroupMessage } = require("../helpers/messageComponents.js");

module.exports = {
    name: "guildScheduledEventUpdate",
    once: false,
    execute: async ({ 0: oldEvent, 1: updatedEvent, client, logger }) => {
        console.log("GOT guildScheduledEventUpdate EVENT");
        const changedProperties = _.reduce(
            oldEvent,
            (res, val, key) => (_.isEqual(val, updatedEvent[key]) ? res : res.concat(key)),
            [],
        );

        if (changedProperties.length === 1 && changedProperties[0] == "status") {
            if (![text_status.ACTIVE, text_status.COMPLETED].includes(updatedEvent.status)) {
                return;
            }

            groupQueries.fetchGroupByEventID.get(updatedEvent.id.toString(), async (err, row) => {
                if (err) return console.error(err);
                if (!row) return;

                const group = groupsSelector.selectById(store.getState(), row.messageID);

                const { guild } = updatedEvent;
                const channel = await guild.channels.fetch(row.channelID);
                const message = await channel.messages.fetch(row.messageID);

                const newMessage = await constructGroupMessage(guild, group, false);

                message
                    .edit(newMessage)
                    .then(newMsg => {
                        newMsg.reply(
                            "The event has started/completed, so I'm making this group inactive!",
                        );

                        store.dispatch(groupRemoved({ id: message.id }));
                        combinedQueries.removeGroupByGroupId(group.id);
                    })
                    .catch(console.error);
            });
        }

        // if (changedProperties.length === 1 && changedProperties[0] == "status") {
        //     // No case for scheduled since its impossible to update to that status
        //     switch (updatedEvent.status) {
        //         case text_status.ACTIVE:
        //             // Do nothing
        //             // Future idea: Disable group buttons while event is active
        //             // Note to self: probably just handle this the same as the others
        //             break;
        //         case text_status.COMPLETED:
        //         case text_status.CANCELED:
        //             // Remove the group from the database and remove buttons from the message
        //             break;
        //         default:
        //             console.log(
        //                 `An unknown Scheduled Event Status was encountered. It was: ${updatedEvent.status}. Refer to the documentation.`
        //             );
        //             break;
        //     }
        // }
    },
};
