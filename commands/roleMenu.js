const { SlashCommandBuilder } = require("discord.js");

const { canBotManageRoles, constructRoleGetMessage } = require("../helpers/roleHelpers.js");

module.exports = {
    disabled: true,
    devOnly: true,
    data: new SlashCommandBuilder()
        .setName("role-menu")
        .setDescription(
            "Displays a message with a dropdown containing the roles available for assignment.",
        ),
    execute: async (interaction, logger) => {
        if (!canBotManageRoles(interaction.guild)) {
            interaction.reply({ content: "Bot can't manage roles", ephemeral: true });
            return;
        }

        interaction.reply(constructRoleGetMessage(interaction.guild));
    },
};
