const mongoose = require("mongoose");

module.exports = {
    // Store user information in the db
    user: new mongoose.Schema({
        _id: String,
        keysmash: {
            prefix: { type: String, default: "" },
            suffix: { type: String, default: "" }
        },
        owo: {
            prefix: { type: String, default: "" },
            suffix: { type: String, default: "" }
        },
        charset: { type: String, default: "" },
        autoproxy: { type: Array, default: [] },
        reblace: { type: Array, default: [] }
    }),

    guildSettings: new mongoose.Schema({
        _id: String,
        unknownCommandMsg: { type: Boolean, default: true },
        dmOwner: { type: Boolean, default: true }
    }),

    // Store message ids in the db so we can tell who sent them
    // Enables users to delete their own messages and makes it possible to query the owner of a message
    message: new mongoose.Schema({
        _id: String,
        original: String,
        owner: String,
        timestamp: { type: Date, default: Date.now }
    }),

    // Store webhook ids so we can fetch them reliably
    webhooks: new mongoose.Schema({
        id: String,
        channel: String
    })
}