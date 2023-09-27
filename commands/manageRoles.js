const { SlashCommandBuilder, PermissionsBitField } = require("discord.js");

const rolesSubCommands = require("../constants/rolesSubCommands.js");
const store = require("../redux/store.js");
const { roleAdded, roleRemoved } = require("../redux/rolesSlice.js");
const roleQueries = require("../db/roleQueries.js");
const {
    canMemberManageRoles,
    canBotManageRoles,
    botCanAssignRole,
} = require("../helpers/roleHelpers.js");

const handleAddRole = async (interaction, logger) => {
    const { options, member, guild } = interaction;

    if (!canMemberManageRoles(member)) {
        interaction.reply({ content: "", ephemeral: true });
        return;
    }

    const { id: guildId } = guild;
    const { id: roleId } = options.getRole("role");

    if (!botCanAssignRole(guild, roleId)) {
        await interaction.reply({
            content:
                "I can't manage that role as I have no role higher than it. Please modify my roles or permissions.",
            ephemeral: true,
        });
        return;
    }

    if (store.getState().roles.ids.includes(roleId)) {
        await interaction.reply({
            content:
                "That role has already been added to the list of assignable roles. Did you mean to specify another role?",
            ephemeral: true,
        });
        return;
    }

    store.dispatch(roleAdded({ guildId, roleId }));
    roleQueries.addRole.run(guildId, roleId, async err => {
        if (err) {
            console.error(err);
            await interaction.reply({
                content: "I wasn't able to add your role as I encountered an error.",
                ephemeral: true,
            });
            return;
        }

        await interaction.reply({
            content: "I've added your role to the list of assignable roles!",
            ephemeral: true,
        });
    });
};

const handleRemoveRole = async (interaction, logger) => {
    const { options, member } = interaction;

    if (!canMemberManageRoles(member)) {
        interaction.reply({ content: "", ephemeral: true });
        return;
    }

    const { id: roleId } = options.getRole("role");

    if (!store.getState().roles.ids.includes(roleId)) {
        await interaction.reply({
            content: "That role isn't on the list of assignable roles, so I can't remove it.",
            ephemeral: true,
        });
        return;
    }

    store.dispatch(roleRemoved({ roleId }));
    roleQueries.removeRole.run(roleId, async err => {
        if (err) {
            console.error(err);
            await interaction.reply({
                content: "I wasn't able to remove your role as I encountered an error.",
                ephemeral: true,
            });
            return;
        }

        await interaction.reply({
            content: "I've removed your role from the list of assignable roles!",
            ephemeral: true,
        });
    });
};

module.exports = {
    disabled: true,
    devOnly: true,
    data: new SlashCommandBuilder()
        .setName("manage-roles")
        .setDescription("Manage or view the list of roles available for assignment.")
        .addSubcommand(subCommand =>
            subCommand
                .setName(rolesSubCommands.ADD)
                .setDescription("Adds a role to the list of roles available for assignment.")
                .addRoleOption(option =>
                    option
                        .setName("role")
                        .setDescription("The role to make available for assignment.")
                        .setRequired(true),
                ),
        )
        .addSubcommand(subCommand =>
            subCommand
                .setName(rolesSubCommands.REMOVE)
                .setDescription("Removes a role from the list of roles available for assignment.")
                .addRoleOption(option =>
                    option
                        .setName("role")
                        .setDescription("The role to make available for assignment.")
                        .setRequired(true),
                ),
        )
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageRoles),
    execute: async (interaction, logger) => {
        if (!canBotManageRoles(interaction.guild)) {
            interaction.reply({ content: "Bot can't manage roles", ephemeral: true });
            return;
        }

        const subCmd = interaction.options.getSubcommand();

        switch (subCmd) {
            case rolesSubCommands.ADD:
                await handleAddRole(interaction, logger);
                break;
            case rolesSubCommands.REMOVE:
                await handleRemoveRole(interaction, logger);
                break;
            default:
                interaction.reply({
                    content:
                        "I didn't recognize that sub command. Please use one of: add, remove, get",
                    ephemeral: true,
                });
                break;
        }
    },
};
