const mongoose = require("mongoose");
const utils = require("../utils.js");
const schemas = require("../schemas.js");
const user = mongoose.model("user", schemas.user);

module.exports = {
    name: "tags",
    aliases: ["proxy"],
    description: "Sets your keysmash tag(s)",
    usage: [
        "**\nClears your keysmash tags",
        "<prefix>smash<suffix>**\nSets your keysmash tag(s). Only either a prefix or suffix is required, not both. Example match must contain the string `smash`"
    ],
    example: "$text",
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
            return setTags(doc, msg, args);
        });
    }
}


// Set or clear keysmash tags
async function setTags(user, msg, args) {
    let response;

    if (args.length > 0) {
        let proxy = args.join(" ");
        if (proxy.includes("smash") == false) return msg.channel.send(utils.errorEmbed("Example match must contain the string \`smash\`, i.e. \`$smash$\`"));

        proxy = proxy.split("smash");
        let prefix = proxy[0].trim() || "";
        let suffix = proxy[1].trim() || "";
        if (prefix == "" && suffix == "") return msg.channel.send(utils.errorEmbed("Cannot have empty keysmash tags! You must provide either a prefix, a suffix, or both, i.e. \`$smash\`"));

        tags = {
            prefix: prefix,
            suffix: suffix
        }
        if (tags.prefix != "" && tags.suffix == "") response = `Set keysmash prefix to \`${prefix}\``;
        else if (tags.prefix == "" && tags.suffix != "") response = `Set keysmash suffix to \`${suffix}\``;
        else response = `Set keysmash prefix to \`${prefix}\` and suffix to \`${suffix}\``;
    } else {
        tags = {
            prefix: "",
            suffix: ""
        }
        response = "Cleared keysmash tags"
    }

    user.tags = tags;
    return await user.save(err => {
        if (err) throw err;
        return msg.channel.send(utils.successEmbed(response));
    });
}