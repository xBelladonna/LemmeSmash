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
    execute: (client, msg) => {
        user.findById(msg.author.id, async (err, doc) => {
            if (err) throw err;
            if (doc == null) return msg.channel.send(utils.errorEmbed("You have not set any tags or a custom character set. Type \`ks;help\` to get started!"));

            let tagsKeysmash = "";
            if (doc.keysmash.prefix != "" && doc.keysmash.suffix == "")
                tagsKeysmash = `Prefix: \`${doc.keysmash.prefix}\`\nExample: Check this out ${doc.keysmash.prefix}sdfgh`;
            else if (doc.keysmash.prefix == "" && doc.keysmash.suffix != "")
                tagsKeysmash = `Suffix: \`${doc.keysmash.suffix}\`\nExample: Check this out sdfgh${doc.keysmash.suffix}`;
            else if (doc.keysmash.prefix != "" && doc.keysmash.suffix != "")
                tagsKeysmash = `Prefix: \`${doc.keysmash.prefix}\`\nSuffix: \`${doc.keysmash.suffix}\`\nExample: Check this out ${doc.keysmash.prefix}sdfgh${doc.keysmash.suffix}`;

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