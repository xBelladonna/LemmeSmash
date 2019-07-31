const mongoose = require("mongoose");
const utils = require("../utils.js");
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
    execute: (client, msg, args) => {
        user.findById(msg.author.id, async (err, doc) => {
            if (err) throw err;
            if (doc == null) {
                let newUser = await new user({
                    _id: msg.author.id,
                    tags: {
                        prefix: "",
                        suffix: ""
                    },
                    charset: ""
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

    if (type == "owospeak") args.shift();
    if (args.length > 0) {
        let proxy = args.join(" ");
        if (proxy.includes("text") == false) return msg.channel.send(utils.errorEmbed("Example match must contain the string \`text\`, i.e. \`$text$\`"));

        proxy = proxy.split("text");
        let prefix = proxy[0].trim() || "";
        let suffix = proxy[1].trim() || "";
        if (prefix == "" && suffix == "") return msg.channel.send(utils.errorEmbed(`Cannot have empty ${type} tags! You must provide either a prefix, a suffix, or both, i.e. \`$text\``));

        tags = {
            prefix: prefix,
            suffix: suffix
        }
        if (tags.prefix != "" && tags.suffix == "") response = `Set ${type} prefix to \`${prefix}\``;
        else if (tags.prefix == "" && tags.suffix != "") response = `Set ${type} suffix to \`${suffix}\``;
        else response = `Set ${type} prefix to \`${prefix}\` and suffix to \`${suffix}\``;
    } else {
        tags = {
            prefix: "",
            suffix: ""
        }
        response = `Cleared ${type} tags`;
    }

    if (type == "keysmash") user.keysmash = tags;
    else if (type == "owospeak") user.owo = tags;

    return await user.save(err => {
        if (err) throw err;
        return msg.channel.send(utils.successEmbed(response));
    });
}