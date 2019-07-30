const mongoose = require("mongoose");
const utils = require("../utils.js");
const schemas = require("../schemas.js");
const user = mongoose.model("user", schemas.user);

module.exports = {
    name: "show",
    aliases: ["s", "display", "settings", "set", "member"],
    description: "Shows your user card with your keysmash tags and custom character set",
    usage: "",
    example: "",
    execute: async (client, msg) => {
        user.findById(msg.author.id, async (err, doc) => {
            if (err) throw err;
            if (doc == null) return msg.channel.send(utils.errorEmbed("You have not set any tags or a character set. Type \`ks;help\` to get started!"));

            let tags;
            if (doc.tags.prefix != "" && doc.tags.suffix == "")
                tags = `Prefix: \`${doc.tags.prefix}\`\nExample: Check this out ${doc.tags.prefix}sdfgh`;
            else if (doc.tags.prefix == "" && doc.tags.suffix != "")
                tags = `Suffix: \`${doc.tags.suffix}\`\nExample: Check this out sdfgh${doc.tags.suffix}`;
            else tags = `Prefix: \`${doc.tags.prefix}\`\nSuffix: \`${doc.tags.suffix}\`\nExample: Check this out ${doc.tags.prefix}sdfgh${doc.tags.suffix}`;

            let embed = utils.successEmbed()
                .setTitle(msg.member.displayName ? `${msg.member.displayName} (${msg.author.tag})` : msg.author.tag)
                .addField((doc.tags.prefix =! "" && doc.tags.suffix != "") ? "Keysmash tags" : "Keysmash tag", tags);
            if (doc.charset != "") embed.addField("Custom character set", `\`${doc.charset}\``);
            if (msg.author.avatarURL) embed.setThumbnail(msg.author.avatarURL);
            return msg.channel.send(embed);
        });
    }
}