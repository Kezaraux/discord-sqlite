const { SlashCommandBuilder } = require("discord.js");

const editSubCommands = require("../constants/editSubCommands");
const store = require("../redux/store.js");
const { groupsSelector } = require("../redux/groupsSlice.js");
const {
    handleDatetime,
    handleSize,
    handleTimezone,
    handleTitle,
} = require("../helpers/editCommandHelpers");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("edit-group")
        .setDescription("A command for editing existing groups.")
        .addSubcommand(subcommand =>
            subcommand
                .setName(editSubCommands.TITLE)
                .setDescription("Edits the specified group's title.")
                .addStringOption(option =>
                    option
                        .setName("value")
                        .setDescription("The new title for the group being edited.")
                        .setRequired(true),
                )
                .addStringOption(option =>
                    option
                        .setName("groupid")
                        .setDescription("The message ID of the group you wish to edit.")
                        .setRequired(true),
                ),
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName(editSubCommands.SIZE)
                .setDescription("Edits the specified group's size.")
                .addIntegerOption(option =>
                    option
                        .setName("value")
                        .setDescription("The new size for the group being edited.")
                        .setRequired(true),
                )
                .addStringOption(option =>
                    option
                        .setName("groupid")
                        .setDescription("The message ID of the group you wish to edit.")
                        .setRequired(true),
                ),
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName(editSubCommands.WHEN)
                .setDescription("Edits the specified group's event time")
                .addStringOption(option =>
                    option
                        .setName("value")
                        .setDescription(
                            "The new event time for the group being edited. Use the format: YYYY-MM-DD HH:mm",
                        )
                        .setRequired(true),
                )
                .addStringOption(option =>
                    option
                        .setName("groupid")
                        .setDescription("The message ID of the group you wish to edit.")
                        .setRequired(true),
                ),
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName(editSubCommands.TIMEZONE)
                .setDescription("Edits the specified group's timezone.")
                .addStringOption(option =>
                    option
                        .setName("value")
                        .setDescription(
                            "The new timezone for the event time of the group being edited. Use identifiers like: America/Toronto",
                        )
                        .setRequired(true),
                )
                .addStringOption(option =>
                    option
                        .setName("groupid")
                        .setDescription("The message ID of the group you wish to edit.")
                        .setRequired(true),
                ),
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
                ephemeral: true,
            });
            return;
        }

        switch (subCmd) {
            case editSubCommands.TITLE:
                await handleTitle(interaction, value, group);
                break;
            case editSubCommands.SIZE:
                await handleSize(interaction, value, group);
                break;
            case editSubCommands.WHEN:
                await handleDatetime(interaction, value, group);
                break;
            case editSubCommands.TIMEZONE:
                await handleTimezone(interaction, value, group);
                break;
            default:
                interaction.reply({
                    content: "I did not recognize that subcommand.",
                    ephemeral: true,
                });
                break;
        }

        return;
    },
};
