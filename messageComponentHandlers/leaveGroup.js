const messageComponentCustomIds = require("../constants/messageComponentCustomIds");
const { groupsSelector, groupMembersSet } = require("../redux/groupsSlice.js");
const store = require("../redux/store");
const { constructGroupEmbed, constructGroupButtons } = require("../helpers/messageComponents");
const { userInGroup } = require("../helpers/groupHelpers");
const userQueries = require("../db/userQueries.js");

module.exports = {
    name: messageComponentCustomIds.LEAVE_GROUP,
    execute: async ({ interaction, client, logger }) => {
        logger.info("Handling leave group");
        const { message, member, guild } = interaction;

        const group = groupsSelector.selectById(store.getState(), message.id);

        if (!userInGroup(group.members, member.id)) {
            logger.info(`Member with id ${member.id} tried to leave a group they're not in.`);
            interaction.reply({ content: "You're not in this group!", ephemeral: true });
            return;
        }

        const currentMembers = Object.keys(group.members);
        const newMembers = currentMembers.reduce((acc, val) => {
            // Create new object since old one you couldn't overwrite properties
            if (val !== member.id) {
                acc[val] = group.members[val];
            }
            return acc;
        }, {});

        const groupObj = {
            ...group,
            members: newMembers,
        };
        const newEmbed = await constructGroupEmbed(guild, groupObj);
        const newButtons = constructGroupButtons();

        message.edit({ embeds: [newEmbed], components: newButtons }).then(async newMsg => {
            store.dispatch(
                groupMembersSet({
                    id: group.id,
                    members: newMembers,
                }),
            );

            userQueries.removeUserFromGroup.run(member.id, group.id, err => {
                if (err) return console.error(err);

                interaction.reply({ content: "I've removed you from the group!", ephemeral: true });
                return;
            });
        });
    },
};
