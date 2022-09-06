const { ActionRowBuilder, ButtonBuilder, EmbedBuilder, ButtonStyle } = require("discord.js");
const momentTz = require("moment-timezone");

const groupStatus = require("../constants/groupStatus");
const buttonCustomIds = require("../constants/buttonCustomIds");
const { getUserDisplayName } = require("../helpers/userHelpers.js");

const constructEmbedField = (name, value, inline = false) => ({ name, value, inline });

const constructGroupEmbed = async (guild, groupObj, active = true) => {
    const { title, size, datetime, timezone, members, creatorID, eventID } = groupObj;
    const embed = new EmbedBuilder()
        .setTitle(title)
        .setDescription(`Number of members needed: ${size}`);
    const eventMoment = momentTz.tz(datetime, timezone ?? "America/Toronto");
    const eventTimestring = eventMoment.format("dddd MMMM Do YYYY h:mm A z");
    const fields = [];
    fields.push(constructEmbedField("Time", eventTimestring));

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
                    `Unknown member status encountered. It was: ${members[member]}. Check group handle reaction.`,
                );
        }
    }

    fields.push(
        constructEmbedField(
            `${groupStatus.CONFIRMED} (${confirmed.length}/${size})`,
            confirmed.join("\n") || "None",
            true,
        ),
    );
    fields.push(
        constructEmbedField(
            `${groupStatus.WAITING} (${waiting.length})`,
            waiting.join("\n") || "None",
            true,
        ),
    );
    fields.push(
        constructEmbedField(
            `${groupStatus.UNKNOWN} (${unknown.length})`,
            unknown.join("\n") || "None",
            true,
        ),
    );

    if (!active) {
        fields.push(constructEmbedField(`Inactive`, `This group is no longer active!`));
    }

    if (eventID) {
        const scheduledEvent = await guild.scheduledEvents.fetch(eventID);
        const url = await scheduledEvent.createInviteURL();
        fields.push(constructEmbedField(`Event URL`, `${url}`));
    }

    embed.addFields(...fields);

    embed.setFooter({
        text: `Group created by: ${await getUserDisplayName(guild, creatorID)}\nGroup ID: ${
            groupObj.id
        }`,
    });

    return embed;
};

const constructGroupButtons = () => {
    const joinRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(buttonCustomIds.JOIN_GROUP)
            .setLabel("Join group")
            .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
            .setCustomId(buttonCustomIds.EXTRA)
            .setLabel("Join as extra")
            .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
            .setCustomId(buttonCustomIds.SHOW_INTEREST)
            .setLabel("Unsure but interested")
            .setStyle(ButtonStyle.Primary),
    );
    const leaveRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(buttonCustomIds.LEAVE_GROUP)
            .setLabel("Leave group")
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId(buttonCustomIds.REMOVE_GROUP)
            .setLabel("Remove group")
            .setStyle(ButtonStyle.Danger),
    );

    return [joinRow, leaveRow];
};

const constructAcknowledgeButton = () => {
    const mainRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(buttonCustomIds.ACKNOWLEDGE)
            .setLabel("Acknowledge")
            .setStyle(ButtonStyle.Success),
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
    constructAcknowledgeButton,
};
