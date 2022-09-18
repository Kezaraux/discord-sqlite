const { SlashCommandBuilder, PermissionsBitField } = require("discord.js");
const momentTimezone = require("moment-timezone");
require("moment-parseplus");

const store = require("../redux/store.js");
const { groupAdded } = require("../redux/groupsSlice.js");
const { createGroup } = require("../db/groupQueries");
const { constructGroupButtons, constructGroupEmbed } = require("../helpers/messageComponents.js");
const guildScheduledEventUpdate = require("../events/guildScheduledEventUpdate.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("create-group")
        .setDescription("A command for forming groups.")
        .addStringOption(option =>
            option
                .setName("title")
                .setDescription("The name/title for the group.")
                .setRequired(true),
        )
        .addIntegerOption(option =>
            option
                .setName("size")
                .setDescription("The number of spaces the group has for members.")
                .setRequired(true),
        )
        .addStringOption(option =>
            option
                .setName("datetime")
                .setDescription(
                    "The date and time of the format: YYYY-MM-DD HH:mm where HH is the hour in 24 hours. Defaults to EST.",
                )
                .setRequired(true),
        )
        // OPTIONAL OPTIONS
        .addBooleanOption(option =>
            option
                .setName("create-event")
                .setDescription(
                    "Whether or not to create an Event for this group. Cancelling the event will not remove the group.",
                )
                .setRequired(false),
        )
        .addChannelOption(option =>
            option
                .setName("event-channel")
                .setDescription("A voice channel to use for guild event.")
                .setRequired(false),
        )
        .addStringOption(option =>
            option
                .setName("timezone")
                .setDescription(
                    "The timezone in which the event is occurring in. Use identifiers like: America/Toronto",
                )
                .setRequired(false),
        )
        .addChannelOption(option =>
            option
                .setName("channel")
                .setDescription("The channel you want this group to appear in.")
                .setRequired(false),
        ),
    execute: async (interaction, logger) => {
        const { member, options, client, guild } = interaction;

        const title = options.getString("title");
        const size = options.getInteger("size");
        const datetime = options.getString("datetime");
        const toCreateEvent = options.getBoolean("create-event") ?? false;
        const eventChannel = options.getChannel("event-channel");
        const timezone = options.getString("timezone", false) ?? "America/Toronto";
        const channel = options.getChannel("channel", false);

        if (!momentTimezone.tz.names().includes(timezone)) {
            await interaction.reply({
                content: `The timezone you provided wasn't recognized. Try something in the format of America/Toronto.`,
                ephemeral: true,
            });
            return;
        }

        const eventMoment = momentTimezone.tz(datetime, timezone);
        if (!eventMoment.isValid()) {
            await interaction.reply({
                content: `The datetime string you provided wasn't valid.
                    Please follow the format: YYYY-MM-DD HH:mm where HH is the hour in 24 hours.`,
                ephemeral: true,
            });
            return;
        }

        let fetchedChannel;
        if (channel) {
            fetchedChannel = await member.guild.channels.cache.get(channel);
        }

        const targetChannel = fetchedChannel || interaction.channel;

        const groupObj = {
            guildID: member.guild.id,
            title,
            size,
            datetime,
            timezone,
            creatorID: member.id,
            members: {},
            eventID: null,
        };

        if (toCreateEvent) {
            const botHasPermission = guild.me.permissions.has(
                PermissionsBitField.Flags.ManageEvents,
            );
            if (!botHasPermission) {
                await interaction.reply({
                    content: `I do not have permissions to create events. Please redo the command without event options.`,
                    ephemeral: true,
                });
                return;
            }

            if (eventMoment.diff(momentTimezone()) < 0) {
                await interaction.reply({
                    content: `The start time for an event must be in the future. Please use a date/time after now.`,
                    ephemeral: true,
                });
                return;
            }

            if (!eventChannel || !eventChannel.isVoice()) {
                await interaction.reply({
                    content: `You set createEvent to true, but didn't specify an event channel, or gave a text channel. Please redo the command, but specify a voice channel for the eventChannel option!`,
                    ephemeral: true,
                });
                return;
            }

            const newEvent = await guild.scheduledEvents.create({
                name: title,
                scheduledStartTime: eventMoment.toISOString(),
                privacyLevel: "GUILD_ONLY",
                entityType: "VOICE",
                channel: eventChannel,
            });

            logger.info(`Successfully created a new scheduled Guild event with id: ${newEvent.id}`);
            groupObj.eventID = newEvent.id;
        }

        const embed = await constructGroupEmbed(guild, groupObj);
        const components = constructGroupButtons();

        const newMessage = await targetChannel.send({
            embeds: [embed],
            components,
        });

        groupObj.id = newMessage.id;
        groupObj.channelID = newMessage.channel.id;

        store.dispatch(groupAdded(groupObj));

        const newEmbed = await constructGroupEmbed(guild, groupObj);
        const newComps = constructGroupButtons();
        const messageWithId = { embeds: [newEmbed], components: newComps };
        newMessage.edit(messageWithId);

        createGroup.run(
            newMessage.id.toString(),
            newMessage.channel.id.toString(),
            newMessage.guildId.toString(),
            title,
            size,
            datetime,
            timezone,
            member.id.toString(),
            groupObj?.eventID?.toString(),
            async err => {
                if (err) {
                    console.error(err);
                    await interaction.reply({
                        content: "I wasn't able to create your group as I encountered an error.",
                        ephemeral: true,
                    });
                    return;
                }

                await interaction.reply({
                    content: "I've created your group!",
                    ephemeral: true,
                });
            },
        );
    },
};
