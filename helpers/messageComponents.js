const { MessageActionRow, MessageButton, MessageEmbed } = require("discord.js");
const momentTz = require("moment-timezone");

const groupStatus = require("../constants/groupStatus");
const buttonCustomIds = require("../constants/buttonCustomIds");
const { getUserDisplayName, fetchUser } = require("../helpers/userHelpers.js");

const constructGroupEmbed = async (guild, groupObj, active = true) => {
    const { title, size, datetime, timezone, members, guildId, creatorID, eventId } = groupObj;
    const embed = new MessageEmbed()
        .setTitle(title)
        .setDescription(`Number of members needed: ${size}`);
    const eventMoment = momentTz.tz(datetime, timezone ?? "America/Toronto");
    const eventTimestring = eventMoment.format("dddd MMMM Do YYYY h:mm A z");
    embed.addField("Time", eventTimestring, false);

    const confirmed = [];
    const waiting = [];
    const unknown = [];

    for (const member in members) {
        const displayName = await getUserDisplayName(guild, member);
        switch (members[member]) {
            case groupStatus.CONFIRMED:
                confirmed.push(displayName);
                break;
            case groupStatus.WAITING:
                waiting.push(displayName);
                break;
            case groupStatus.UNKNOWN:
                unknown.push(displayName);
                break;
            default:
                console.log(
                    `Unknown member status encountered. It was: ${members[member]}. Check group handle reaction.`
                );
        }
    }

    embed.addField(
        `${groupStatus.CONFIRMED} (${confirmed.length}/${size})`,
        confirmed.join("\n") || "None",
        true
    );
    embed.addField(
        `${groupStatus.WAITING} (${waiting.length})`,
        waiting.join("\n") || "None",
        true
    );
    embed.addField(
        `${groupStatus.UNKNOWN} (${unknown.length})`,
        unknown.join("\n") || "None",
        true
    );

    if (!active) {
        embed.addField(`Inactive`, `This group is no longer active!`, false);
    }

    if (eventId) {
        const scheduledEvent = await guild.scheduledEvents.fetch(eventId);
        const url = await scheduledEvent.createInviteURL();
        embed.addField(`Event URL`, `${url}`, false);
    }

    embed.setFooter(
        `Group created by: ${await getUserDisplayName(guild, creatorID)}\nGroup ID: ${groupObj.id}`
    );

    return embed;
};

const constructGroupButtons = () => {
    const joinRow = new MessageActionRow().addComponents(
        new MessageButton()
            .setCustomId(buttonCustomIds.JOIN_GROUP)
            .setLabel("Join group")
            .setStyle("SUCCESS"),
        new MessageButton()
            .setCustomId(buttonCustomIds.EXTRA)
            .setLabel("Join as extra")
            .setStyle("SUCCESS"),
        new MessageButton()
            .setCustomId(buttonCustomIds.SHOW_INTEREST)
            .setLabel("Unsure but interested")
            .setStyle("PRIMARY")
    );
    const leaveRow = new MessageActionRow().addComponents(
        new MessageButton()
            .setCustomId(buttonCustomIds.LEAVE_GROUP)
            .setLabel("Leave group")
            .setStyle("SECONDARY"),
        new MessageButton()
            .setCustomId(buttonCustomIds.REMOVE_GROUP)
            .setLabel("Remove group")
            .setStyle("DANGER")
    );

    return [joinRow, leaveRow];
};

const constructAcknowledgeButton = () => {
    const mainRow = new MessageActionRow().addComponents(
        new MessageButton()
            .setCustomId(buttonCustomIds.ACKNOWLEDGE)
            .setLabel("Acknowledge")
            .setStyle("SUCCESS")
    );

    return [mainRow];
};

const constructGroupMessage = async (guild, groupObj, active = true) => {
    const newEmbed = await constructGroupEmbed(guild, groupObj, active);
    const newButtons = constructGroupButtons(active);

    return active
        ? { embeds: [newEmbed], components: newButtons }
        : { content: "\u200b", embeds: [newEmbed], components: [] };
};

module.exports = {
    constructGroupEmbed,
    constructGroupButtons,
    constructGroupMessage,
    constructAcknowledgeButton
};
