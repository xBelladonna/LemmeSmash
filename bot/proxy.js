const mongoose = require("mongoose");
const schemas = require("./schemas.js");
const user = mongoose.model("user", schemas.user);
const message = mongoose.model("messages", schemas.message);
const config = require("../config.json");
const utils = require("./utils.js");
const keysmash = require("./keysmash.js");

module.exports.execute = async (client, msg) => {
    if (msg.channel.type !== "text")
        return msg.channel.send(`I can't proxy in DMs because webhooks don't exist in them ${keysmash.ISOStandard("sdfghjvb")}`);

    await user.findById(msg.author.id).then(async doc => { // Get the user document from the db
        if (doc == null) return; // If not found, do nothing

        let content;
        if (matchTags(doc, msg) === true) content = await replaceByKeysmash(doc, msg.content);

        if (doc.autoproxy.includes(msg.guild.id)) content = await owoify(content != null ? content : msg.content);
        else if (msg.content.startsWith(doc.owo.prefix) && msg.content.endsWith(doc.owo.suffix)) {
            if (doc.owo.prefix === "" && doc.owo.suffix === "") return;
            if (content != null) msg.content = content;
            msg.content = await msg.content.slice(doc.owo.prefix.length, -doc.owo.suffix.length == 0 ? msg.content.length : -doc.owo.suffix.length).trim();
            content = await owoify(msg.content);
        };

        if (!content) return;
        // Ensure permissions and abort if missing
        if (!await utils.ensurePermissions(client, msg, config.permissions.proxy)) return;
        if (content.length > 2000) return msg.channel.send(utils.errorEmbed("All good things in moderation..."));

        const hook = await utils.getWebhook(client, msg.channel); // Get the webhook (or create one if it doesn't exist)
        if (hook instanceof Error) throw hook;

        // Construct webhook payload options
        const options = {
            username: utils.truncateOrPadUsername(msg.member.displayName), // Set the name to either a server nickname (if exists) or a username
            avatarURL: msg.author.avatarURL, // Get the URL of the user's avatar
            files: await utils.attach(msg.attachments), // Convert message attachments to an array of file objects
            disableEveryone: true
        };

        try {
            // Send the complete webhook payload
            const sentMessage = await hook.send(content, options);

            // Record the resulting message's details in the db
            await new message({
                _id: sentMessage.id,
                original: msg.id,
                owner: msg.member.id,
            }).save();

            await msg.delete(250); // Wait 0.25 seconds before yeeting to prevent stuck message
        } catch (e) {
            // Sometimes something deletes the message before we get to it. Bit of an edge case but it happens sometimes, in which case it's not a problem anyway, bail
            if (e.code === 10008) return;
            // Otherwise just throw
            else throw e;
        };
    });
};


function matchTags(doc, msg) {
    if ((doc.keysmash.prefix != "" && doc.keysmash.suffix == "") && msg.content.includes(doc.keysmash.prefix))
        return true;
    else if ((doc.keysmash.prefix == "" && doc.keysmash.suffix != "") && msg.content.includes(doc.keysmash.suffix))
        return true;
    else if ((doc.keysmash.prefix != "" && doc.keysmash.suffix != "") && msg.content.includes(doc.keysmash.prefix && doc.keysmash.suffix))
        return true;
    else return false;
};

async function replaceByKeysmash(doc, msg) {
    // Match for prefixes, suffixes, or both, and get the charset if specified with the tag(s)
    let pattern;
    let match = [];
    let content = msg.split(" ");
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
};

async function owoify(content) {
    if (!content) return;
    return await content.split(" ")
        .map(x => !utils.validateUrl(x) ? x.replace(new RegExp("l|r", "ig"), x => x === x.toUpperCase() ? "W" : "w") : x)
        .map(x => !utils.validateUrl(x) ? x.replace(new RegExp("^the\\b", "ig"), x => x === x.toUpperCase() ? "DA" : "da") : x)
        .map(x => !utils.validateUrl(x) ? x.replace(new RegExp("^th", "ig"), x => x === x.toUpperCase() ? "D" : "d") : x)
        .map(x => !utils.validateUrl(x) ? x.replace(new RegExp("[ts]ion", "ig"), x => x === x.toUpperCase() ? "SHUN" : "shun") : x)
        .join(" ");
};