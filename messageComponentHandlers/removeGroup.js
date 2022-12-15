const { PermissionsBitField } = require("discord.js");

const buttonCustomIds = require("../constants/buttonCustomIds");
const { groupsSelector, groupRemoved } = require("../redux/groupsSlice.js");
const store = require("../redux/store");
const combinedQueries = require("../db/combinedQueries.js");
const { constructGroupMessage } = require("../helpers/messageComponents.js");
const { removeGroupWithMessage } = require("../helpers/groupHelpers");

module.exports = {
    name: buttonCustomIds.REMOVE_GROUP,
    execute: async ({ interaction, client, logger }) => {
        logger.info("Handling delete group");
        const { message, member } = interaction;
        const group = groupsSelector.selectById(store.getState(), message.id);

        if (!group) {
            logger.info(`There is no group for message of ID: ${message.id}`);
            interaction.reply({
                content:
                    "I don't have a group for this message in my database. Something weird must have happened. Please delete the associated message.",
                ephemeral: true,
            });
            return;
        }

        if (
            member.id !== group.creatorID &&
            !member.permissionsIn(message.channel).has(PermissionsBitField.Flags.ManageMessages)
        ) {
            console.log(member.id, group.creatorID);
            console.log(
                !member
                    .permissionsIn(message.channel)
                    .has(PermissionsBitField.Flags.ManageMessages),
            );
            interaction.reply({
                content: `The group can only be removed if:
            1) The group creator requests it
            2) You have permissions to manage messages in this channel`,
                ephemeral: true,
            });
            return;
        }

        const result = await removeGroupWithMessage(message);
        interaction.reply({ content: result.message, ephemeral: true });

        // store.dispatch(groupRemoved({ id: message.id }));
        // combinedQueries.removeGroupByGroupId(group.id);

        // if (group.eventID) {
        //     const guildEvent = await interaction.guild.scheduledEvents.fetch(group.eventID);
        //     guildEvent
        //         .delete()
        //         .then(() => {
        //             console.log(`Deleted the event ${group.eventID} for group ${group.id}`);
        //         })
        //         .catch(console.error);
        // }

        // const newMessage = await constructGroupMessage(interaction.guild, group, false);

        // message
        //     .edit(newMessage)
        //     .then(updatedMessage => {
        //         console.log(
        //             `Successfully removed group and edited message for group ${message.id}`,
        //         );
        //         interaction.reply({
        //             content:
        //                 "I've removed the group! Consider replying to the group message with a reason for it is no longer active.",
        //             ephemeral: true,
        //         });
        //     })
        //     .catch(err => {
        //         console.log(
        //             `Something went wrong when editing the message for group ${message.id}`,
        //         );
        //         console.error(err);
        //         interaction.reply({
        //             content:
        //                 "Something went wrong when I tried to edit the group message. The group has been removed, please delete the message.",
        //             ephemeral: true,
        //         });
        //     });
    },
};
