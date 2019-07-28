const mongoose = require("mongoose");
const schemas = require("./schemas.js");
const user = mongoose.model("user", schemas.user);
//const messages = mongoose.model("messages", schemas.message);
const config = require("../config.json");
const utils = require("./utils.js");
const keysmash = require("./keysmash.js");

module.exports.execute = async (client, msg) => {
    user.findById(msg.author.id, async (err, doc) => { // Get the user document from the db
        if (err) throw err;
        if (doc == null) return; // If not found, do nothing
        const prefix = doc.tags.prefix || null;
        const suffix = doc.tags.suffix || null;
        if (!msg.content.includes(prefix) && !msg.content.includes(suffix)) return; // If message doesn't contain tags, do nothing
        if (prefix == suffix) {
            await msg.content.replace(prefix, null);
            if (msg.content != null)
                if (!msg.content.replace(prefix, null).includes(suffix)) return;
        }

        // TODO: Check permissions

        // Match for prefixes, suffixes, or both, and get the charset if specified with the tag(s)
        let pattern;
        let match = [];
        let content = msg.content.split(" ");
        let charset = [];
        if (prefix != null && suffix == null) {
            pattern = new RegExp(`${utils.escapeCharacters(prefix)}([^\\s]*)`, "g");
            for (let i = 0; i < content.length; i++) {
                match.push(content[i].match(pattern) != null ? content[i].match(pattern).toString() : "");
                charset.push(match[i].length > prefix.length ? match[i].slice(prefix.length, match[i].length) : "");
            }
        }
        else if (prefix == null && suffix != null) {
            pattern = new RegExp(`([^\\s]*)${utils.escapeCharacters(suffix)}`, "g");
            for (let i = 0; i < content.length; i++) {
                match.push(content[i].match(pattern) != null ? content[i].match(pattern).toString() : "");
                charset.push(match[i].length > suffix.length ? match[i].slice(0, match[i].length - suffix.length) : "");
            }
        }
        else {
            pattern = new RegExp(`${utils.escapeCharacters(prefix)}([^\\s]*)${utils.escapeCharacters(suffix)}`, "g");
            for (let i = 0; i < content.length; i++) {
                match.push(content[i].match(pattern) != null ? content[i].match(pattern).toString() : "");
                charset.push(match[i].length > prefix.length + suffix.length ? match[i].slice(prefix.length, match[i].length - suffix.length) : "");
            }
        }

        // Replace all instances of tags with a keysmash
        for (let i = 0; i < content.length; i++) {
            content[i] = content[i].replace(pattern, keysmash.ISOStandard(charset[i] || config.defaultCharset));
        }

        const hook = await utils.getWebhook(client, msg.channel); // Get the webhook (or create one if it doesn't exist)
        const name = msg.member.displayName || msg.author.username; // Set the name to either a server nickname or a username
        const avatar = msg.author.avatarURL; // Get the URL of the user's avatar

        // Construct and send webhook payload
        const sentMessage = await hook.send(content.join(" "), {
            username: name,
            avatarURL: avatar,
            disableEveryone: true
        });

        // TODO: Record the resulting message details in the db
        /*
        var messageRecord = new messages({
            _id: sentMessage.id,
            owner: msg.member.id,
            character: character._id
        }).save();
        */

        return msg.delete(); // Finally, delete the original message
    });
}