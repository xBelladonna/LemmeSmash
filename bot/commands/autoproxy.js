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
        "**\nToggles between enabled and disabled states (per-server)"
    ],
    example: "",
    execute: async (client, msg, args) => {
        if (msg.channel.type !== "text")
            return msg.channel.send(utils.errorEmbed("This command only works in servers!"));
        await user.findById(msg.author.id).then(async doc => {
            if (doc == null) {
                let newUser = await new user({
                    _id: msg.author.id,
                    autoproxy: []
                });
                doc = newUser;
            }
            return toggleState(doc, msg);
        });
    }
}


// Toggle autoproxy state
async function toggleState(user, msg) {
    let response;

    if (!user.autoproxy.includes(msg.guild.id)) {
        user.autoproxy.push(msg.guild.id);
        response = `Enabled autoproxying to owospeak in **${msg.guild.name}** ${keysmash.ISOStandard("sdfghjvb")}`;
    } else {
        user.autoproxy = user.autoproxy.filter(id => id !== msg.guild.id);
        response = `Disabled autoproxying to owospeak in **${msg.guild.name}**`;
    }

    return await user.save(await msg.channel.send(utils.successEmbed(response)));
}