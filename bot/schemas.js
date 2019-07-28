const mongoose = require("mongoose");

module.exports = {
    user: new mongoose.Schema({
        _id: String,
        tags: {
            prefix: { type: String, default: "" },
            suffix: { type: String, default: "" }
        },
        charset: { type: String, default: "" }
    })
}