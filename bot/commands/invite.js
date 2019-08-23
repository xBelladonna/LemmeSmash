const config  = require("../../config.json");
const utils = require("../utils.js");

module.exports = {
    name: "invite",
    aliases: ["i", "add", "link"],
    description: "Generates an invite link for this bot's specific account",
    usage: [""],
    examples: null,
    execute: async (client, msg, args) => {
        const flags = config.permissions.proxy.concat(config.permissions.commands); // Compile permission flags into a single array
        const inviteUrl = await client.generateInvite(flags); // Generate invite URL with proper permissions
        return msg.channel.send(utils.successEmbed().addField("Invite link!", `[Click here to invite this bot to your server!](${inviteUrl})`));
    }
}