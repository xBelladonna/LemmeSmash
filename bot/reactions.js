const mongoose = require('mongoose');
const schemas = require('./schemas.js');
const message = mongoose.model("messages", schemas.message);
const utils = require ("./utils.js");
const keysmash = require("./keysmash.js");
const events = {
    MESSAGE_REACTION_ADD: "messageReactionAdd"
};


module.exports.execute = async client => {
    client.on("messageReactionAdd", async (react, user) => {
        if (react.emoji) {
            switch (react.emoji.name) {
                case "❓" || "❔":
                    return queryMessage(react, user, client);

                case "❌":
                    return deleteMessage(react, user, client);

                default:
                    break;
            }
        }
    })

    // React to uncached messages using the raw gateway event payload
    client.on('raw', async event => {
        if (!events.hasOwnProperty(event.t)) return; // If the event wasn't a reaction, do nothing
        const { d: data } = event; // load data from payload key "d" into memory
        const channel = client.channels.get(data.channel_id) || await user.createDM();
        if (channel.messages.has(data.message_id)) return; // If message is aleady cached, do nothing

        const user = client.users.get(data.user_id);
        const message = await channel.fetchMessage(data.message_id);
        const emojiKey = data.emoji.id ? `${data.emoji.name}: ${data.emoji.id}` : data.emoji.name; // Extract emoji data as `key: value`
        const reaction = message.reactions.get(emojiKey); // Get the reaction
        client.emit(events[event.t], reaction, user); // Emit a messageReactionAdd event with the reaction
    });
}

async function queryMessage(react, user, client) {
    message.findOne({ _id: react.message.id }, async (err, doc) => {
        if (err) { // Handle errors
            console.warn(err);
            utils.logTraceback(err, client);
            return react.message.channel.send(utils.errorEmbed("Something went wrong with that reaction"));
        }
        if (doc == null) return; // If the message wasn't a proxied message, do nothing
        react.remove(user.id); // Removee the reaction ASAP
        const owner = await client.fetchUser(doc.owner);
        let response = utils.successEmbed()
            .setAuthor(owner.tag, owner.avatarURL)
            .setDescription(react.message.content)
            .addField("Sent by", `${owner} (${owner.id})`)
            .setTimestamp(doc.timestamp);

        try {
            await user.send(response);
        } catch (err) {
            const msg = await react.message.channel
                .send(`I can't DM you ${user} ${keysmash.ISOStandard("sdfghjb")}`);
            await utils.sleep(10 * 1000);
            msg.delete();
            const logMsg = `Unable to DM ${user.tag} a message card due to the following error:\n${err.stack}`;
            console.error(logMsg);
        }
    })
}

function deleteMessage(react, user, client) {
    message.findById(react.message.id, async (err, doc) => {
        if (err) {
            console.warn(err);
            utils.stackTrace(client, null, err);
            return react.message.channel.send(utils.errorEmbed("Something went wrong with that reaction"));
        }
        if (doc == null) return;
        if (user.id != doc.owner) return;
        message.findByIdAndDelete(doc._id, err => {
            if (err) {
                console.warn(err);
                utils.stackTrace(client, null, err);
                return react.message.channel.send(utils.errorEmbed("Something went wrong with that reaction"));
            }
            return react.message.delete();
        })
    })
}