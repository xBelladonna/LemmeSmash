const mongoose = require("mongoose");
const schemas = require("./schemas.js");
const user = mongoose.model("user", schemas.user);
const message = mongoose.model("messages", schemas.message);
const config = require("../config.json");
const utils = require("./utils.js");
const keysmash = require("./keysmash.js");

module.exports.execute = async (client, msg) => {
    if (msg.channel.type !== "text")
        return msg.channel.send("I can't proxy in DMs because webhooks don't exist in them!");

    user.findById(msg.author.id, async (err, doc) => { // Get the user document from the db
        if (err) throw err;
        if (doc == null) return; // If not found, do nothing
        if (!new RegExp(`${doc.keysmash.prefix}|${doc.keysmash.suffix}|${doc.owo.prefix}|${doc.owo.suffix}`, "g").test(msg.contents))
            return; // If message doesn't contain tags, do nothing

        /* deprecated code (removing this didn't hurt but if you figure out what this did please tell me)

        if (prefix == suffix) {
        await msg.content.replace(prefix, null);
        if (msg.content != null)
            if (!msg.content.replace(prefix, null).includes(suffix)) return;
        }
        */

        // Check permissions
        utils.checkPermissions(client, msg, config.permissions.proxy);
        let content;
        if ((doc.keysmash.prefix != "" && doc.keysmash.suffix == "") && msg.content.includes(doc.keysmash.prefix))
            content = await replaceByKeysmash(doc, msg);
        else if ((doc.keysmash.prefix == "" && doc.keysmash.suffix != "") && msg.content.includes(doc.keysmash.suffix))
            content = await replaceByKeysmash(doc, msg);
        else if ((doc.keysmash.prefix != "" && doc.keysmash.suffix != "") && msg.content.includes(doc.keysmash.prefix && doc.keysmash.suffix))
            content = await replaceByKeysmash(doc, msg);
        else if ((doc.owo.prefix != "" && doc.owo.suffix == "") && msg.content.includes(doc.owo.prefix))
            content = await owoify(doc, msg);
        else if ((doc.owo.prefix == "" && doc.owo.suffix != "") && msg.content.includes(doc.owo.suffix))
            content = await owoify(doc, msg);
        else if ((doc.owo.prefix != "" && doc.owo.suffix != "") && msg.content.includes(doc.owo.prefix && doc.owo.suffix))
            content = await owoify(doc, msg);
        if (!content) return;

        const hook = await utils.getWebhook(client, msg.channel); // Get the webhook (or create one if it doesn't exist)
        const name = msg.member.displayName || msg.author.username; // Set the name to either a server nickname or a username
        const avatar = msg.author.avatarURL; // Get the URL of the user's avatar

        // Construct and send webhook payload
        const sentMessage = await hook.send(content, {
            username: name,
            avatarURL: avatar,
            disableEveryone: true
        });

        // Record the resulting message details in the db
        new message({
            _id: sentMessage.id,
            owner: msg.member.id,
        }).save();

        return msg.delete(); // Finally, delete the original message
    });
}


async function replaceByKeysmash(doc, msg) {
    // Match for prefixes, suffixes, or both, and get the charset if specified with the tag(s)
    let pattern;
    let match = [];
    let content = msg.content.split(" ");
    let charset = [];
    if (doc.keysmash.prefix != null && doc.keysmash.suffix == null) { // If there's a prefix but no suffix
        pattern = new RegExp(`${utils.escapeCharacters(doc.keysmash.prefix)}([^\\s]*)`, "g"); // Match for tags and prefixed charsets
        for (let i = 0; i < content.length; i++) { // Iterate over, creating an array of tags to replace
            match.push(content[i].match(pattern) != null ? content[i].match(pattern).toString() : "");
            charset.push(match[i].length > doc.keysmash.prefix.length ? match[i].slice(doc.keysmash.prefix.length, match[i].length) : "");
        }
    }
    else if (doc.keysmash.prefix == null && doc.keysmash.suffix != null) { // Match for suffixes only, the rest is the same as above
        pattern = new RegExp(`([^\\s]*)${utils.escapeCharacters(doc.keysmash.suffix)}`, "g");
        for (let i = 0; i < content.length; i++) {
            match.push(content[i].match(pattern) != null ? content[i].match(pattern).toString() : "");
            charset.push(match[i].length > doc.keysmash.suffix.length ? match[i].slice(0, match[i].length - doc.keysmash.suffix.length) : "");
        }
    }
    else { // When there's both a prefix and suffix
        pattern = new RegExp(`${utils.escapeCharacters(doc.keysmash.prefix)}([^\\s]*)${utils.escapeCharacters(doc.keysmash.suffix)}`, "g");
        for (let i = 0; i < content.length; i++) {
            match.push(content[i].match(pattern) != null ? content[i].match(pattern).toString() : "");
            charset.push(match[i].length > doc.keysmash.prefix.length + doc.keysmash.suffix.length ? match[i].slice(doc.keysmash.prefix.length, match[i].length - doc.keysmash.suffix.length) : "");
        }
    }

    // Replace all instances of tags with a keysmash
    for (let i = 0; i < content.length; i++) {
        content[i] = content[i].replace(pattern, keysmash.ISOStandard(charset[i] || doc.charset || config.defaultCharset));
    }

    return content.join(" ");
}

async function owoify(doc, msg) {
    const pattern = new RegExp(`${utils.escapeCharacters(doc.owo.prefix)}|${utils.escapeCharacters(doc.owo.suffix)}`, "g");
    //if (!doc.owo.prefix && doc.owo.suffix) pattern = new RegExp(`${doc.owo.suffix}`, "g");
    //else pattern = new RegExp(`${doc.owo.prefix}|${doc.owo.suffix}`, "g");
    msg.content = await msg.content.replace(pattern, "");
    if (!msg.content) return;
    return msg.content.replace(new RegExp("l|r", "g"), "w").replace(new RegExp("L|R", "g"), "W");
}