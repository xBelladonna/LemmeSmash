const mongoose = require("mongoose");
const utils = require("../utils.js");
const schemas = require("../schemas.js");
const user = mongoose.model("users", schemas.user);

module.exports = {
    name: "show",
    aliases: ["s", "display", "settings", "set", "member"],
    description: "Shows your user card with your owo tags and custom character set",
    usage: "",
    example: "",
    execute: async (client, msg) => {
        user.findById(msg.author.id, async (err, doc) => {
            if (err) throw err;
            if (doc == null) return msg.channel.send(utils.errorEmbed("You have not set any tags or a character set. Type \`ks;help\` to get started!"));

            let tagsKeysmash = "";
            if (doc.owo.prefix != "" && doc.owo.suffix == "")
                tagsKeysmash = `Prefix: \`${doc.owo.prefix}\`\nExample: Check this out ${doc.owo.prefix}sdfgh`;
            else if (doc.owo.prefix == "" && doc.owo.suffix != "")
                tagsKeysmash = `Suffix: \`${doc.owo.suffix}\`\nExample: Check this out sdfgh${doc.owo.suffix}`;
            else if (doc.owo.prefix != "" && doc.owo.suffix != "")
                tagsKeysmash = `Prefix: \`${doc.owo.prefix}\`\nSuffix: \`${doc.owo.suffix}\`\nExample: Check this out ${doc.owo.prefix}sdfgh${doc.owo.suffix}`;

            let tagsOwo  = "";
            if (doc.owo.prefix != "" && doc.owo.suffix == "")
                tagsOwo = `Prefix: \`${doc.owo.prefix}\`\nExample: ${doc.owo.prefix}Hello world`;
            else if (doc.owo.prefix == "" && doc.owo.suffix != "")
                tagsOwo = `Suffix: \`${doc.owo.suffix}\`\nExample: Hello world${doc.owo.suffix}`;
            else if (doc.owo.prefix != "" && doc.owo.suffix != "")
                tagsOwo = `Prefix: \`${doc.owo.prefix}\`\nSuffix: \`${doc.owo.suffix}\`\nExample: ${doc.owo.prefix}Hello world${doc.owo.suffix}`;

            let embed = utils.successEmbed()
                .setTitle(msg.member.displayName ? `${msg.member.displayName} (${msg.author.tag})` : msg.author.tag);
                if (tagsKeysmash != "")
                    embed.addField((doc.owo.prefix =! "" && doc.owo.suffix != "") ? "Keysmash tags" : "Keysmash tag", tagsKeysmash);
                if (tagsOwo != "")
                    embed.addField((doc.owo.prefix = ! "" && doc.owo.suffix != "") ? "OwO tags" : "OwO tag", tagsOwo);
            if (doc.charset != "") embed.addField("Custom character set", `\`${doc.charset}\``);
            if (msg.author.avatarURL) embed.setThumbnail(msg.author.avatarURL);
            return msg.channel.send(embed);
        });
    }
}