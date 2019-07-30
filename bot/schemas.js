const mongoose = require("mongoose");

module.exports = {
    user: new mongoose.Schema({
        _id: String,
        tags: {
            prefix: { type: String, default: "" },
            suffix: { type: String, default: "" }
        },
        owo: {
            prefix: { type: String, default: "" },
            suffix: { type: String, default: "" }
        },
        charset: { type: String, default: "" }
    }),

    // Store message ids in the db so we can tell who sent them
    // Enables users to delete their own messages and makes it possible to query the owner of a message
    message: new mongoose.Schema({
        _id: String,
        owner: String,
        timestamp: { type: Date, default: Date.now }
    }),

    // Store reactions in db so we don't have to await a promise or something, leaving hanging threads
    reaction: new mongoose.Schema({
        _id: String,
        user: String,
        settings: Object   // Settings object must have `type` tag
    })
}