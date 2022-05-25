const { SlashCommandBuilder } = require("@discordjs/builders");
const momentTimezone = require("moment-timezone");

const groupQueries = require("../db/groupQueries.js");
const { constructGroupEmbed, constructGroupButtons } = require("../helpers/messageComponents.js");
const store = require("../redux/store.js");
const {
    groupTitleChanged,
    groupDatetimeChanged,
    groupSizeChanged,
    groupTimezoneChanged,
    groupsSelector
} = require("../redux/groupsSlice.js");

const updateScheduledEvent = async (interaction, eventId, property, value) => {
    if (!eventId) return;

    const payload = {
        [property]: value
    };

    interaction.guild.scheduledEvents
        .edit(eventId, payload)
        .then((updatedEvent) => {
            console.log(`Successfully updated event ${eventId}`);
        })
        .catch((err) => {
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
        (await channel.messages.cache.get(groupObj.id)) ||
        (await channel.messages.fetch(groupObj.id));

    message
        .edit({ embeds: [newEmbed], components: newButtons })
        .then((newMsg) => console.log(`Edited message for group ${groupObj.id}`))
        .catch(console.error);
};

const handleTitle = async (interaction, value, group) => {
    groupQueries.updateGroupTitle.run(value, group.id, (err) => {
        if (err) return console.error(err);

        store.dispatch(groupTitleChanged({ id: group.id, title: value }));
        updateScheduledEvent(interaction, group.eventId, "name", value);
        updateMessage(interaction, group.id);

        interaction.reply({
            content: "I successfully updated your group's title!",
            ephemeral: true
        });
        return;
    });
};

const handleSize = async (interaction, value, group) => {
    groupQueries.updateGroupSize.run(value, group.id, (err) => {
        if (err) return console.error(err);

        store.dispatch(groupSizeChanged({ id: group.id, size: value }));
        updateMessage(interaction, group.id);

        interaction.reply({
            content: "I successfully updated your group's size!",
            ephemeral: true
        });
        return;
    });
};

const handleDatetime = async (interaction, value, group) => {
    const eventMoment = momentTimezone.tz(value, "America/Toronto");
    if (!eventMoment.isValid()) {
        await interaction.reply({
            content: `The datetime string you provided wasn't valid. Please follow the format: YYYY-MM-DD HH:mm where HH is the hour in 24 hours.`,
            ephemeral: true
        });
        return;
    }

    groupQueries.updateGroupEventTime.run(value, group, (err) => {
        if (err) return console.error(err);

        store.dispatch(groupDatetimeChanged({ id: group.id, datetime: value }));
        updateScheduledEvent(
            interaction,
            group.eventId,
            "scheduledStartTime",
            eventMoment.toISOString()
        );
        updateMessage(interaction, group.id);

        interaction.reply({
            content: "I successfully updated your group's event time!",
            ephemeral: true
        });
        return;
    });
};

const handleTimezone = async (interaction, value, group) => {
    const eventMoment = momentTimezone.tz(value, "America/Toronto");
    if (!eventMoment.isValid()) {
        await interaction.reply({
            content: `The datetime string you provided wasn't valid. Please follow the format: YYYY-MM-DD HH:mm where HH is the hour in 24 hours.`,
            ephemeral: true
        });
        return;
    }

    groupQueries.updateGroupTimezone.run(value, group.channelID, (err) => {
        if (err) return console.error(err);

        store.dispatch(groupTimezoneChanged({ id: group.id, timezone: value }));
        updateScheduledEvent(
            interaction,
            group.eventId,
            "scheduledStartTime",
            eventMoment.toISOString()
        );
        updateMessage(interaction, group.id);

        interaction.reply({
            content: "I successfully updated your group's timezone!",
            ephemeral: true
        });
        return;
    });
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName("edit-group")
        .setDescription("A command for editing existing groups.")
        .addSubcommand((subcommand) =>
            subcommand
                .setName("title")
                .setDescription("Edits the specified group's title.")
                .addStringOption((option) =>
                    option
                        .setName("value")
                        .setDescription("The new title for the group being edited.")
                        .setRequired(true)
                )
                .addStringOption((option) =>
                    option
                        .setName("groupid")
                        .setDescription("The message ID of the group you wish to edit.")
                        .setRequired(true)
                )
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("size")
                .setDescription("Edits the specified group's size.")
                .addIntegerOption((option) =>
                    option
                        .setName("value")
                        .setDescription("The new size for the group being edited.")
                        .setRequired(true)
                )
                .addStringOption((option) =>
                    option
                        .setName("groupid")
                        .setDescription("The message ID of the group you wish to edit.")
                        .setRequired(true)
                )
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("when")
                .setDescription("Edits the specified group's event time")
                .addStringOption((option) =>
                    option
                        .setName("value")
                        .setDescription(
                            "The new event time for the group being edited. Use the format: YYYY-MM-DD HH:mm"
                        )
                        .setRequired(true)
                )
                .addStringOption((option) =>
                    option
                        .setName("groupid")
                        .setDescription("The message ID of the group you wish to edit.")
                        .setRequired(true)
                )
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("timezone")
                .setDescription("Edits the specified group's timezone.")
                .addStringOption((option) =>
                    option
                        .setName("value")
                        .setDescription(
                            "The new timezone for the event time of the group being edited. Use identifiers like: America/Toronto"
                        )
                        .setRequired(true)
                )
                .addStringOption((option) =>
                    option
                        .setName("groupid")
                        .setDescription("The message ID of the group you wish to edit.")
                        .setRequired(true)
                )
        ),
    execute: async (interaction, logger) => {
        const { options, member } = interaction;

        const subCmd = options.getSubcommand();
        const value = options.get("value").value;
        const groupID = options.get("groupid").value;

        const group = groupsSelector.selectById(store.getState(), groupID);
        if (member.id !== group.creatorID) {
            interaction.reply({
                content:
                    "You cannot edit this group since you didn't create it. Please get the group owner to perform any edits.",
                ephemeral: true
            });
            return;
        }

        switch (subCmd) {
            case "title":
                await handleTitle(interaction, value, group);
                break;
            case "size":
                await handleSize(interaction, value, group);
                break;
            case "when":
                await handleDatetime(interaction, value, group);
                break;
            case "timezone":
                await handleTimezone(interaction, value, group);
                break;
            default:
                interaction.reply({
                    content: "I did not recognize that subcommand.",
                    ephemeral: true
                });
                break;
        }

        return;
    }
};
