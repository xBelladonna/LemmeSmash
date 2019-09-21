const mongoose = require("mongoose");
const utils = require("../utils.js");
const schemas = require("../schemas.js");
const user = mongoose.model("users", schemas.user);

module.exports = {
    name: "show",
    aliases: ["display", "user", "profile", "member"],
    description: "Shows your user card with your owo tags and custom character set, or of another user's if you pass their user ID",
    usage: [
        "",
        "**<user ID>**"
    ],
    examples: [
        "",
        "075795705503915751"
    ],
    execute: async (client, msg, args) => {
        const userId = args.length > 0 && args.length < 2 ? args[0] : msg.author.id;

        await user.findById(userId).then(async doc => {
            if (doc == null) return msg.channel.send(utils.errorEmbed(`${args.length > 0 && args.length < 2 ? "That user has" : "You have"} not set any tags or a custom character set. Type \`ks;help\` to get started!`));

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

            const user = msg.channel.type === "text" ? await msg.guild.fetchMember(userId) : await client.users.get(userId);
            console.log(user)
            let embed = utils.successEmbed()
            if (msg.channel.type === "text")
                embed.setTitle(user.displayName ? `${user.displayName} (${user.user.tag})` : user.tag);
            else embed.setTitle(user.tag);
            if (msg.channel.type === "text" && user.user.avatarURL)
                embed.setThumbnail(user.user.avatarURL);
            if (msg.channel.type !== "text" && user.avatarURL)
                embed.setThumbnail(user.avatarURL);

            if (tagsKeysmash != "")
                embed.addField((doc.owo.prefix =! "" && doc.owo.suffix != "") ? "Keysmash tags" : "Keysmash tag", tagsKeysmash);
            if (tagsOwo != "")
                embed.addField((doc.owo.prefix = ! "" && doc.owo.suffix != "") ? "OwO tags" : "OwO tag", tagsOwo);
            if (doc.charset != "")
                embed.addField("Custom character set", `\`${doc.charset}\``);

            return msg.channel.send(embed);
        });
    }
}