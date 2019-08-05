const mongoose = require("mongoose");
const utils = require("../utils.js");
const schemas = require("../schemas.js");
const guildSettings = mongoose.model("guildSettings", schemas.guildSettings);

module.exports = {
    name: "set",
    aliases: ["setting", "settings"],
    description: "Changes various settings for the server, if you have the Manage Messages permission.\n",
    usage: [
        "UnknownCommand**\nToggles the unknown command message on or off for the guild (command is not case sensitive)"
    ],
    example: "",
    execute: (client, msg, args) => {
        if (!msg.member.hasPermission("MANAGE_MESSAGES")) return; // If not correct permissions, bail
        guildSettings.findById(msg.guild.id, async (err, doc) => {
            if (err) throw err;
            if (doc == null) {
                let newGuild = await new guildSettings({
                    _id: msg.guild.id,
                    unknownCommandMsg: true
                });
                doc = newGuild;
            }
            if (args[0] === "UnknownCommand".toLowerCase()) return toggleState(doc, msg, args);
            return displaySettings(doc, msg, args);
        });
    }
}


async function displaySettings(doc, msg, args) {
    return msg.channel.send(utils.successEmbed(`Unknown command messages are ${doc.unknownCommandMsg === false ? "disabled" : "enabled"} in **${msg.guild.name}**`));
}

// Toggle autoproxy state
async function toggleState(doc, msg, args) {
    let response;

    if (doc.unknownCommandMsg === true) {
        doc.unknownCommandMsg = false;
        response = `Disabled unknown command messages in **${msg.guild.name}**`;
    } else {
        doc.unknownCommandMsg = true;
        response = `Enabled unknown command messages in **${msg.guild.name}**`;
    }

    return await doc.save(err => {
        if (err) throw err;
        return msg.channel.send(utils.successEmbed(response));
    });
}