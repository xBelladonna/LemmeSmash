const mongoose = require("mongoose");
const utils = require("../utils.js");
const keysmash = require("../keysmash.js");
const schemas = require("../schemas.js");
const user = mongoose.model("user", schemas.user);

module.exports = {
    name: "autoproxy",
    aliases: ["a", "auto", "autowo"],
    description: "Enables automatic proxying to owospeak without using tags",
    usage: [
        "**\nToggles between enabled and disabled states"
    ],
    example: "",
    execute: (client, msg, args) => {
        user.findById(msg.author.id, async (err, doc) => {
            if (err) throw err;
            if (doc == null) {
                let newUser = await new user({
                    _id: msg.author.id,
                    autoproxy: false,
                    charset: ""
                });
                doc = newUser;
            }
            return toggleState(doc, msg, args);
        });
    }
}


// Toggle autoproxy state
async function toggleState(user, msg, args) {
    let response;

    if (user.autoproxy === false) {
        user.autoproxy = true;
        response = `Enabled autoproxying to owospeak ${keysmash.ISOStandard("sdfghjvb")}`;
    } else {
        user.autoproxy = false;
        response = "Disabled autoproxying to owospeak";
    }

    return await user.save(err => {
        if (err) throw err;
        return msg.channel.send(utils.successEmbed(response));
    });
}