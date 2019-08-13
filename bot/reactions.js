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
        try {
            switch (react.emoji.name) {
                case "❓":
                case "❔":
                    await queryMessage(react, user, client);
                    break;

                case "❌":
                    await deleteMessage(react, user);
                    break;

                default:
                    break;
            }
        } catch (e) {
            react.message.channel.send(utils.errorEmbed("Encountered an error while trying to handle that reaction!")); // Notify the user
            return utils.stackTrace(client, null, e); // Then log the stack trace to the log channel if configured
        }
    });

    // React to uncached messages using the raw gateway event payload
    client.on('raw', async event => {
        if (!events.hasOwnProperty(event.t)) return; // If the event wasn't a reaction, do nothing
        const { d: data } = event; // load data from payload key "d" into memory
        const channel = client.channels.get(data.channel_id) || await user.createDM();
        if (channel.messages.has(data.message_id)) return; // If message is aleady cached, do nothing

        const user = client.users.get(data.user_id);
        const message = await channel.fetchMessage(data.message_id);
        const emojiKey = data.emoji.id ? `${data.emoji.name}:${data.emoji.id}` : data.emoji.name; // Extract emoji data as `key:value` (Discord accepts input in this format only)
        const reaction = message.reactions.get(emojiKey); // Get the reaction
        client.emit(events[event.t], reaction, user); // Emit a messageReactionAdd event with the reaction
    });
}

async function queryMessage(react, user, client) {
    await message.findById(react.message.id).then(async doc => {
        if (doc == null) return; // If the message wasn't a proxied message, do nothing
        react.remove(user.id); // Remove the reaction ASAP

        const owner = await client.fetchUser(doc.owner);
        let response = utils.successEmbed()
            .setAuthor(owner.tag, owner.avatarURL)
            .setDescription(react.message.content)
            .addField("Sent by", `${owner} (ID: ${owner.id})`)
            .setFooter("Sent:")
            .setTimestamp(doc.timestamp);

        try {
            await user.send(response);
        } catch (e) {
            if (e.code === 50007) {
                const msg = await react.message.channel
                    .send(`I can't DM you ${user}, please check your privacy settings ${keysmash.ISOStandard("sdfghjb")}`);
                await utils.sleep(10 * 1000);
                msg.delete();
            }
            else throw e;
        }
    });
}

async function deleteMessage(react, user) {
    await message.findById(react.message.id).then(async doc => {
        if (doc == null || user.id != doc.owner) return;

        await message.findByIdAndDelete(doc._id).then(await react.message.delete());
    });
}