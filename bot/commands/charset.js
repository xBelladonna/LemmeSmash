const mongoose = require("mongoose");
const utils = require("../utils.js");
const schemas = require("../schemas.js");
const user = mongoose.model("user", schemas.user);

module.exports = {
    name: "charset",
    aliases: ["c", "char", "chars", "characters", "letters"],
    description: "Sets a custom character set to generate keysmashes from",
    usage: [
        "**\nClears your custom character set",
        "<characters>**\nSets your custom character set to the characters you specify"
    ],
    example: "asdfcvbn",
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
            return setCustomChars(doc, msg, args);
        });
    }
}


// Set or clear keysmash tags
async function setCustomChars(user, msg, args) {
    let charset;
    let response;

    if (args.length > 0) {
        charset = args.join(" ");
        response = `Set custom characters to \`${charset}\``;
    } else {
        charset = "";
        response = "Cleared custom character set";
    }

    user.charset = charset;
    return await user.save(err => {
        if (err) throw err;
        return msg.channel.send(utils.successEmbed(response));
    });
}