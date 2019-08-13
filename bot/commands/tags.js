const config = require("../../config.json");
const utils = require("../utils.js");
const mongoose = require("mongoose");
const schemas = require("../schemas.js");
const user = mongoose.model("user", schemas.user);

module.exports = {
    name: "tags",
    aliases: ["t", "tag", "p", "proxy"],
    description: "Sets your keysmash tag(s), or your owospeak tag(s)",
    usage: [
        "**\nClears your keysmash tags",
        "<prefix>text<suffix>**\nSets your keysmash tag(s). Only either a prefix or suffix is required, not both. Example match must contain the string `text`",
        "owo <prefix>text<suffix>**\nSets your owospeak tag(s). Same as above."
    ],
    example: "#!text",
    execute: async (client, msg, args) => {
        await user.findById(msg.author.id).then(async doc => {
            if (doc == null) {
                let newUser = await new user({
                    _id: msg.author.id,
                    keysmash: {
                        prefix: "",
                        suffix: ""
                    },
                    owo: {
                        prefix: "",
                        suffix: "",
                    }
                });
                doc = newUser;
            }
            switch(args[0]) {
                case "owo":
                    return setTags(doc, msg, "owospeak", args);

                default:
                    return setTags(doc, msg, "keysmash", args);
            }
        });
    }
}


// Set or clear keysmash tags
async function setTags(user, msg, type, args) {
    let tags;
    let response;
    const tagsConflict = utils.errorEmbed(`You've already used either that prefix or suffix for your ${type} tags! Please try again with different tags or type \`${config.prefix}show\` to see your current settings.`);

    if (type === "owospeak") args.shift();
    if (args.length > 0) {
        let proxy = args.join(" ");
        if (!proxy.includes("text")) return msg.channel.send(utils.errorEmbed("Example match must contain the string \`text\`, i.e. \`$text$\`"));

        proxy = proxy.split("text");
        let prefix = proxy[0].trim() || "";
        let suffix = proxy[1].trim() || "";
        if (prefix === "" && suffix === "") return msg.channel.send(utils.errorEmbed(`Cannot have empty ${type} tags! You must provide either a prefix, a suffix, or both, i.e. \`$text\``));

        // TODO: Refactor this entire block, it's fugly
        if (type === "keysmash") {
            if (prefix !== "" && suffix === "" && prefix === (user.owo.prefix || user.owo.suffix))
                return msg.channel.send(tagsConflict);
            else if (prefix === "" && suffix !== "" && suffix === (user.owo.prefix || user.owo.suffix))
                return msg.channel.send(tagsConflict);
            else if (prefix !== "" && suffix !== "" && prefix === (user.owo.prefix || user.owo.suffix) && suffix === (user.owo.prefix || user.owo.suffix))
                return msg.channel.send(tagsConflict);
        } else if (type === "owospeak") {
            if (prefix !== "" && suffix === "" && prefix === (user.keysmash.prefix || user.keysmash.suffix))
                return msg.channel.send(tagsConflict);
            else if (prefix === "" && suffix !== "" && suffix === (user.keysmash.prefix || user.keysmash.suffix))
                return msg.channel.send(tagsConflict);
            else if (prefix !== "" && suffix !== "" && prefix === (user.keysmash.prefix || user.keysmash.suffix) && suffix === (user.keysmash.prefix || user.keysmash.suffix))
                return msg.channel.send(tagsConflict);
        }

        tags = {
            prefix: prefix,
            suffix: suffix
        }
        if (tags.prefix !== "" && tags.suffix === "") response = `Set ${type} prefix to \`${prefix}\``;
        else if (tags.prefix === "" && tags.suffix !== "") response = `Set ${type} suffix to \`${suffix}\``;
        else response = `Set ${type} prefix to \`${prefix}\` and suffix to \`${suffix}\``;
    } else {
        tags = {
            prefix: "",
            suffix: ""
        }
        response = `Cleared ${type} tags`;
    }

    if (type === "keysmash") user.keysmash = tags;
    else if (type === "owospeak") user.owo = tags;

    return await user.save(await msg.channel.send(utils.successEmbed(response)));
}