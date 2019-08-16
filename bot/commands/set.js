const mongoose = require("mongoose");
const config = require("../../config.json");
const utils = require("../utils.js");
const schemas = require("../schemas.js");
const guildSettings = mongoose.model("guildSettings", schemas.guildSettings);
const defaultPrefix = config.prefix[0].toLowerCase();

module.exports = {
    name: "set",
    aliases: ["setting", "settings"],
    description: "Changes various settings for the server, if you have the Manage Messages permission",
    usage: [
        "**\nDisplays the current server's settings",
        "UnknownCommand**\nToggles the unknown command message on or off (command is not case-sensitive)",
        "DMOwner**\nToggles DMing the server owner about missing permissions on or off (not case-sensitive)"
    ],
    example: "",
    execute: async (client, msg, args) => {
        if (msg.channel.type !== "text")
            return msg.channel.send(utils.errorEmbed("This command only works in servers!"));
        await guildSettings.findById(msg.guild.id).then(async doc => {
            if (doc == null) {
                doc = await new guildSettings({
                    _id: msg.guild.id,
                    unknownCommandMsg: true,
                    dmOwner: true
                });
            }
            if (args.length === 0) return displaySettings(doc, msg, args); // If no arguments, just display the guild's settings, no need to check perms
            if (!msg.member.hasPermission("MANAGE_MESSAGES")) return; // If not correct permissions, bail

            switch (args[0]) {
                case "UnknownCommand".toLowerCase():
                    return toggleCommandError(doc, msg, args);

                case "DMOwner".toLowerCase():
                    return toggleDMOwner(doc, msg, args);
            }
        });
    }
}


async function displaySettings(doc, msg, args) {
    let embed = utils.successEmbed()
        .setAuthor(`Settings for ${msg.guild.name}`, msg.guild.iconURL)
        .addField("Unknown command errors:", `${doc.unknownCommandMsg === true ? "**Enabled**" : "**Disabled**"}\nHint: to toggle between enabled and disabled, type \`${defaultPrefix}set UnknownCommand\``)
        .addField("DM owner about missing permissions:" ,`${doc.dmOwner === true ? "**Enabled**" : "**Disabled**"}\nHint: to toggle between enabled and disabled, type \`${defaultPrefix}set DMOwner\``);
    return msg.channel.send(embed);
}

// Toggle autoproxy state
async function toggleCommandError(doc, msg, args) {
    let response;

    if (doc.unknownCommandMsg === true) {
        doc.unknownCommandMsg = false;
        response = `Disabled unknown command messages in **${msg.guild.name}**`;
    } else {
        doc.unknownCommandMsg = true;
        response = `Enabled unknown command messages in **${msg.guild.name}**`;
    }

    return await doc.save(await msg.channel.send(utils.successEmbed(response)));
}

async function toggleDMOwner(doc, msg, args) {
    let response;

    if (doc.dmOwner === true) {
        doc.dmOwner = false;
        response = `Disabled DMing the owner of **${msg.guild.name}** (${await msg.client.fetchUser(msg.guild.ownerID)}) about missing permissions`;
    } else {
        doc.dmOwner = true;
        response = `Enabled DMing the owner of **${msg.guild.name}** (${await msg.client.fetchUser(msg.guild.ownerID)}) about missing permissions`;
    }

    return await doc.save(await msg.channel.send(utils.successEmbed(response)));
}