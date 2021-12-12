const { SlashCommandBuilder } = require("@discordjs/builders");
const momentTimezone = require("moment-timezone");

const store = require("../redux/store.js");
const { groupAdded } = require("../redux/groupsSlice.js");
const { createGroup } = require("../db/groupQueries");
const { constructGroupButtons, constructGroupEmbed } = require("../helpers/messageComponents.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("create-group")
        .setDescription("A command for forming groups.")
        .addStringOption((option) =>
            option
                .setName("title")
                .setDescription("The name/title for the group.")
                .setRequired(true)
        )
        .addIntegerOption((option) =>
            option
                .setName("size")
                .setDescription("The number of spaces the group has for members.")
                .setRequired(true)
        )
        .addStringOption((option) =>
            option
                .setName("datetime")
                .setDescription(
                    "The date and time of the format: YYYY-MM-DD HH:mm where HH is the hour in 24 hours. Defaults to EST."
                )
                .setRequired(true)
        )
        .addStringOption((option) =>
            option
                .setName("timezone")
                .setDescription(
                    "The timezone in which the event is occurring in. Use identifiers like: America/Toronto"
                )
                .setRequired(false)
        )
        .addChannelOption((option) =>
            option
                .setName("channel")
                .setDescription("The channel you want this group to appear in.")
                .setRequired(false)
        ),
    execute: async (interaction, logger) => {
        const { member, options, client, guild } = interaction;

        // console.log(options.data); // [ {name, type, value}, ... ]

        const title = options.getString("title");
        const size = options.getInteger("size");
        const datetime = options.getString("datetime");
        const timezone = options.getString("timezone", false) ?? "America/Toronto";
        const channel = options.getChannel("channel", false);

        const eventMoment = momentTimezone.tz(datetime, timezone);
        if (!eventMoment.isValid()) {
            await interaction.reply({
                content:
                    "The datetime string you provided wasn't valid.\nPlease follow the format: YYYY-MM-DD HH:mm where HH is the hour in 24 hours.",
                ephemeral: true
            });
            return;
        }

        let fetchedChannel;
        if (channel) {
            fetchedChannel = await member.guild.channels.cache.get(channel);
        }

        const targetChannel = fetchedChannel || interaction.channel;

        const groupObj = {
            guildId: member.guild.id,
            title,
            size,
            datetime,
            timezone,
            creatorID: member.id,
            members: {}
        };

        const embed = await constructGroupEmbed(guild, groupObj);
        const components = constructGroupButtons();

        const newMessage = await targetChannel.send({
            embeds: [embed],
            components
        });

        groupObj.id = newMessage.id;
        groupObj.channelId = newMessage.channel.id;
        console.log(groupObj);

        console.log(`THE THING YOU WANT IS: ${newMessage.id}`);

        store.dispatch(groupAdded(groupObj));

        createGroup.run(
            newMessage.id.toString(),
            newMessage.channel.id.toString(),
            newMessage.guildId.toString(),
            title,
            size,
            datetime,
            timezone,
            member.id.toString(),
            async (err) => {
                if (err) {
                    console.error(err);
                    await interaction.reply({
                        content: "I wasn't able to create your group as I encountered an error.",
                        ephemeral: true
                    });
                    return;
                }

                await interaction.reply({
                    content: "I've created your group!",
                    ephemeral: true
                });
            }
        );
    }
};
