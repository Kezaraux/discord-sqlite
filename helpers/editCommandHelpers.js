const momentTimezone = require("moment-timezone");

const groupQueries = require("../db/groupQueries.js");
const { constructGroupEmbed, constructGroupButtons } = require("../helpers/messageComponents.js");
const store = require("../redux/store.js");
const {
    groupTitleChanged,
    groupDatetimeChanged,
    groupSizeChanged,
    groupTimezoneChanged,
    groupsSelector,
} = require("../redux/groupsSlice.js");

const updateScheduledEvent = async (interaction, eventId, property, value) => {
    if (!eventId) return;

    const payload = {
        [property]: value,
    };

    interaction.guild.scheduledEvents
        .edit(eventId, payload)
        .then(updatedEvent => {
            console.log(`Successfully updated event ${eventId}`);
        })
        .catch(err => {
            console.log(`Encountered an issue when updating event ${eventId}`);
            console.error(err);
        });
};

const updateMessage = async (interaction, groupId) => {
    const groupObj = groupsSelector.selectById(store.getState(), groupId);

    const newEmbed = await constructGroupEmbed(interaction.guild, groupObj);
    const newButtons = constructGroupButtons();

    const channel = await interaction.guild.channels.fetch(groupObj.channelID);
    const message =
        (await channel?.messages?.fetch({ message: groupObj.id, cache: true, force: true })) ??
        (await channel?.messages?.cache?.find(m => m.id === groupObj.id));

    message
        .edit({ embeds: [newEmbed], components: newButtons })
        .then(newMsg => console.log(`Edited message for group ${groupObj.id}`))
        .catch(console.error);
};

const handleTitle = async (interaction, value, group) => {
    groupQueries.updateGroupTitle.run(value, group.id, err => {
        if (err) return console.error(err);

        store.dispatch(groupTitleChanged({ id: group.id, title: value }));
        updateScheduledEvent(interaction, group.eventId, "name", value);
        updateMessage(interaction, group.id);

        interaction.reply({
            content: "Your group's title has been successfully updated!",
            ephemeral: true,
        });
        return;
    });
};

const handleSize = async (interaction, value, group) => {
    groupQueries.updateGroupSize.run(value, group.id, err => {
        if (err) return console.error(err);

        store.dispatch(groupSizeChanged({ id: group.id, size: value }));
        updateMessage(interaction, group.id);

        interaction.reply({
            content: "Your group's size has been successfully updated!",
            ephemeral: true,
        });
        return;
    });
};

const handleDatetime = async (interaction, value, group) => {
    const eventMoment = momentTimezone.tz(value, "America/Toronto");
    if (!eventMoment.isValid()) {
        await interaction.reply({
            content: `The datetime string you provided wasn't valid. Please follow the format: YYYY-MM-DD HH:mm where HH is the hour in 24 hours.`,
            ephemeral: true,
        });
        return;
    }

    groupQueries.updateGroupEventTime.run(value, group.id, err => {
        if (err) return console.error(err);

        store.dispatch(groupDatetimeChanged({ id: group.id, datetime: value }));
        updateScheduledEvent(
            interaction,
            group.eventId,
            "scheduledStartTime",
            eventMoment.toISOString(),
        );
        updateMessage(interaction, group.id);

        interaction.reply({
            content: "Your group's event time has been successfully updated!",
            ephemeral: true,
        });
        return;
    });
};

const handleTimezone = async (interaction, value, group) => {
    const eventMoment = momentTimezone.tz(value, "America/Toronto");
    if (!eventMoment.isValid()) {
        await interaction.reply({
            content: `The datetime string you provided wasn't valid. Please follow the format: YYYY-MM-DD HH:mm where HH is the hour in 24 hours.`,
            ephemeral: true,
        });
        return;
    }

    groupQueries.updateGroupTimezone.run(value, group.id, err => {
        if (err) return console.error(err);

        store.dispatch(groupTimezoneChanged({ id: group.id, timezone: value }));
        updateScheduledEvent(
            interaction,
            group.eventId,
            "scheduledStartTime",
            eventMoment.toISOString(),
        );
        updateMessage(interaction, group.id);

        interaction.reply({
            content: "Your group's timezone has been successfully updated!",
            ephemeral: true,
        });
        return;
    });
};

module.exports = {
    handleSize,
    handleDatetime,
    handleTimezone,
    handleTitle,
};
