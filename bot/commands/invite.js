const config  = require("../../config.json");
const utils = require("../utils.js");

module.exports = {
    name: "invite",
    aliases: ["i", "add", "link"],
    description: "Generates an invite link for this bot's specific account",
    usage: [""],
    examples: null,
    execute: async (client, msg, args) => {
        const author = await client.user;
        const guildMember = msg.channel.type === "text" ? await msg.guild.fetchMember(author) : false;
        const flags = config.permissions.proxy.concat(config.permissions.commands); // Compile permission flags into a single array
        const inviteUrl = await client.generateInvite(flags); // Generate invite URL with proper permissions
        const serverUrl = "https://discord.gg/N5cBcp3"; // Permanent invite link to official server
        const embed = utils.successEmbed();
        embed.setAuthor(guildMember ? `${guildMember.displayName} (${author.tag})` : author.tag, author.avatarURL);
        embed.addField("Invite me!", `[Click here to invite this bot to your server!](${inviteUrl})`);
        embed.addField("Get help and support!", `[Click here to join the support server!](${serverUrl})`);
        return msg.channel.send(embed);
    }
}