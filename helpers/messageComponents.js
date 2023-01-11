const { ActionRowBuilder, ButtonBuilder, EmbedBuilder, ButtonStyle } = require("discord.js");
const { max } = require("lodash");
const momentTz = require("moment-timezone");
require("moment-parseplus");

const groupStatus = require("../constants/groupStatus");
const messageComponentCustomIds = require("../constants/messageComponentCustomIds");
const { getUserDisplayName } = require("../helpers/userHelpers.js");

const constructEmbedField = (name, value, inline = false) => ({ name, value, inline });

/**
 *
 * @param {String[]} arr The array of strings to be appended to
 * @param {String} name The name to append to the array
 * @returns {Boolean} Returns true if appending the name to the array won't push the character length past 1024, false otherwise
 */
const checkCharacterLimit = (arr, name) => {
    if ((arr.join("\n") + `\n${name}`).length > 1024) return false;
    return true;
};

const manageNameArrays = (holder, index, name) => {
    if (!holder[index]) {
        holder.push([]);
        if (checkCharacterLimit(holder[index], name)) {
            holder[index].push(name);
        }
    } else {
        if (checkCharacterLimit(holder[index], name)) {
            holder[index].push(name);
        } else {
            manageNameArrays(holder, index + 1, name);
        }
    }
};

const constructCategoryFields = (holders, size) => {
    const [confirmed, waiting, unknown] = holders;
    const fields = [];
    const limit = max([confirmed.length, waiting.length, unknown.length]);

    for (let i = 0; i < limit; i++) {
        if (confirmed[i]) {
            fields.push(
                constructEmbedField(
                    `${groupStatus.CONFIRMED} (${confirmed[i].length}/${size})`,
                    confirmed[i].join("\n") || "None",
                    true,
                ),
            );
        }
        if (waiting[i] && waiting[i].length !== 0) {
            fields.push(
                constructEmbedField(
                    `${groupStatus.WAITING} (${waiting[i].length})`,
                    waiting[i].join("\n") || "None",
                    true,
                ),
            );
        }
        if (unknown[i] && unknown[i].length !== 0) {
            fields.push(
                constructEmbedField(
                    `${groupStatus.UNKNOWN} (${unknown[i].length})`,
                    unknown[i].join("\n") || "None",
                    true,
                ),
            );
        }
        if (i + 1 !== limit) {
            fields.push(constructEmbedField("\u200b", "\u200b", false));
        }
    }

    return fields;
};

const constructGroupEmbed = async (guild, groupObj, active = true) => {
    const { title, size, datetime, timezone, members, creatorID, eventID } = groupObj;
    const embed = new EmbedBuilder()
        .setTitle(title)
        .setDescription(`Number of members needed: ${size}`);
    const eventMoment = momentTz.tz(datetime, timezone ?? "America/Toronto");
    // const eventTimestring = eventMoment.format("dddd MMMM Do YYYY h:mm A z");
    const fields = [];
    fields.push(constructEmbedField("Time", `<t:${eventMoment.unix()}:F>`));

    const confirmed = [[]];
    const waiting = [[]];
    const unknown = [[]];

    for (const member in members) {
        const displayName = await getUserDisplayName(guild, member);
        switch (members[member]) {
            case groupStatus.CONFIRMED:
                // confirmed.push(displayName);
                manageNameArrays(confirmed, 0, displayName);
                break;
            case groupStatus.WAITING:
                // waiting.push(displayName);
                manageNameArrays(waiting, 0, displayName);
                break;
            case groupStatus.UNKNOWN:
                // unknown.push(displayName);
                manageNameArrays(unknown, 0, displayName);
                break;
            default:
                console.log(
                    `Unknown member status encountered. It was: ${members[member]}. Check group handle reaction.`,
                );
        }
    }

    // fields.push(
    //     constructEmbedField(
    //         `${groupStatus.CONFIRMED} (${confirmed.length}/${size})`,
    //         confirmed.join("\n") || "None",
    //         true,
    //     ),
    // );
    // if (waiting.length !== 0) {
    //     fields.push(
    //         constructEmbedField(
    //             `${groupStatus.WAITING} (${waiting.length})`,
    //             waiting.join("\n") || "None",
    //             true,
    //         ),
    //     );
    // }
    // if (unknown.length !== 0) {
    //     fields.push(
    //         constructEmbedField(
    //             `${groupStatus.UNKNOWN} (${unknown.length})`,
    //             unknown.join("\n") || "None",
    //             true,
    //         ),
    //     );
    // }
    fields.push(...constructCategoryFields([confirmed, waiting, unknown], size));

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
            .setCustomId(messageComponentCustomIds.JOIN_GROUP)
            .setLabel("Join group")
            .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
            .setCustomId(messageComponentCustomIds.EXTRA)
            .setLabel("Join as extra")
            .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
            .setCustomId(messageComponentCustomIds.SHOW_INTEREST)
            .setLabel("Unsure but interested")
            .setStyle(ButtonStyle.Primary),
    );
    const leaveRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(messageComponentCustomIds.LEAVE_GROUP)
            .setLabel("Leave group")
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId(messageComponentCustomIds.REMOVE_GROUP)
            .setLabel("Remove group")
            .setStyle(ButtonStyle.Danger),
    );

    return [joinRow, leaveRow];
};

const constructAcknowledgeButton = () => {
    const mainRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(messageComponentCustomIds.ACKNOWLEDGE)
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
