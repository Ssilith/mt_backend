const mongoose = require("mongoose");

var categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    color: {
        type: String,
        required: true,
    },
});

module.exports = mongoose.model("Category", categorySchema);