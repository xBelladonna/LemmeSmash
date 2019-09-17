const mongoose = require("mongoose");
const utils = require("../utils.js");
const keysmash = require("../keysmash.js");
const schemas = require("../schemas.js");
const user = mongoose.model("user", schemas.user);

module.exports = {
    name: "reblace",
    aliases: ["re🅱lace", "autoreblace", "autore🅱lace", "b", "🅱"],
    description: "Automatically re🅱laces your message",
    usage: [
        "\nToggles between enabled and disabled states (per-server)"
    ],
    examples: null,
    execute: async (client, msg, args) => {
        if (msg.channel.type !== "text")
            return msg.channel.send(utils.errorEmbed("This command only works in servers!"));
        await user.findById(msg.author.id).then(async doc => {
            if (doc == null) {
                let newUser = await new user({
                    _id: msg.author.id,
                    reblace: []
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

    if (!user.reblace.includes(msg.guild.id)) {
        user.reblace.push(msg.guild.id);
        response = `Enabled re🅱lacing in **${msg.guild.name}**`;
    } else {
        user.reblace = user.reblace.filter(id => id !== msg.guild.id);
        response = `Disabled re🅱lacing in **${msg.guild.name}**`;
    }

    return await user.save(await msg.channel.send(utils.successEmbed(response)));
}