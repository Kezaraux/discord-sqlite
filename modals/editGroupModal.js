const {
    ModalBuilder,
    ActionRowBuilder,
    TextInputBuilder,
    TextInputStyle,
    SelectMenuBuilder,
} = require("discord.js");

const buttonCustomIds = require("../constants/buttonCustomIds");

const constructEditGroupModal = groupId =>
    new ModalBuilder()
        .setCustomId(buttonCustomIds.EDIT_MODAL)
        .setTitle(`Edit group: ${groupId}`)
        .addComponents(
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId(buttonCustomIds.EDIT_SELECT)
                    .setLabel("Group property to edit")
                    .setPlaceholder("One of: size, title, when, timezone")
                    .setStyle(TextInputStyle.Short),
                // new SelectMenuBuilder()
                //     .setCustomId(buttonCustomIds.EDIT_SELECT)
                //     .setPlaceholder("Select group property to edit")
                //     .addOptions(
                //         {
                //             label: "Group size",
                //             description: "The number of spaces the group has for members.",
                //             value: "size",
                //         },
                //         {
                //             label: "Group title",
                //             description: "The name/title for the group.",
                //             value: "title",
                //         },
                //         {
                //             label: "Group time",
                //             description:
                //                 "The date and time of the format: YYYY-MM-DD HH:mm where HH is the hour in 24 hours. Defaults to EST.",
                //             value: "when",
                //         },
                //         {
                //             label: "Group timezone",
                //             description:
                //                 "The timezone in which the event is occurring in. Use identifiers of format: America/Toronto",
                //             value: "timezone",
                //         },
                //     ),
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId(buttonCustomIds.EDIT_VALUE)
                    .setLabel("New value for property:")
                    .setPlaceholder("If changing when, use format: YYYY-MM-DD HH:mm")
                    .setStyle(TextInputStyle.Short),
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId(buttonCustomIds.EDIT_GROUPID)
                    .setLabel(`Group ID - Do not edit`)
                    .setValue(groupId)
                    .setStyle(TextInputStyle.Short),
                // new SelectMenuBuilder()
                //     .setCustomId(buttonCustomIds.EDIT_GROUPID)
                //     .setDisabled(true)
                //     .setOptions({
                //         label: `Group ID: ${groupId}`,
                //         description: "The ID of the group you're trying to edit",
                //         value: groupId,
                //     }),
            ),
        );

module.exports = {
    constructEditGroupModal,
};
