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

const updateMessage = async (interaction, groupID) => {
    const group = groupsSelector.selectById(store.getState(), groupID);

    const newEmbed = await constructGroupEmbed(interaction.guild, group);
    const newButtons = constructGroupButtons();

    const channel = await interaction.client.channels.resolve(group.channelID);
    const message = await channel.messages.fetch(group.id);

    message
        .edit({ embeds: [newEmbed], components: newButtons })
        .then((newMsg) => console.log(`Edited message for group ${group.id}`))
        .catch(console.error);
};

const handleTitle = async (interaction, value, groupID) => {
    groupQueries.updateGroupTitle.run(value, groupID, (err) => {
        if (err) return console.error(err);

        store.dispatch(groupTitleChanged({ id: groupID, title: value }));
        updateMessage(interaction, groupID);

        interaction.reply({
            content: "I successfully updated your group's title!",
            ephemeral: true
        });
        return;
    });
};

const handleSize = async (interaction, value, groupID) => {
    console.log(value);
    groupQueries.updateGroupSize.run(value, groupID, (err) => {
        if (err) return console.error(err);

        store.dispatch(groupSizeChanged({ id: groupID, size: value }));
        updateMessage(interaction, groupID);

        interaction.reply({
            content: "I successfully updated your group's size!",
            ephemeral: true
        });
        return;
    });
};

const handleDatetime = async (interaction, value, groupID) => {
    const eventMoment = momentTimezone.tz(value, "America/Toronto");
    if (!eventMoment.isValid()) {
        await interaction.reply({
            content:
                "The datetime string you provided wasn't valid.\nPlease follow the format: YYYY-MM-DD HH:mm where HH is the hour in 24 hours.",
            ephemeral: true
        });
        return;
    }

    groupQueries.updateGroupEventTime.run(value, groupID, (err) => {
        if (err) return console.error(err);

        store.dispatch(groupDatetimeChanged({ id: groupID, datetime: value }));
        updateMessage(interaction, groupID);

        interaction.reply({
            content: "I successfully updated your group's event time!",
            ephemeral: true
        });
        return;
    });
};

const handleTimezone = async (interaction, value, groupID) => {
    groupQueries.updateGroupTimezone.run(value, groupID, (err) => {
        if (err) return console.error(err);

        store.dispatch(groupTimezoneChanged({ id: groupID, timezone: value }));
        updateMessage(interaction, groupID);

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
                await handleTitle(interaction, value, groupID);
                break;
            case "size":
                await handleSize(interaction, value, groupID);
                break;
            case "when":
                await handleDatetime(interaction, value, groupID);
                break;
            case "timezone":
                await handleTimezone(interaction, value, groupID);
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
