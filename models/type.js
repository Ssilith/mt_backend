const mongoose = require("mongoose");

var typeSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            trim: true,
            required: true,
        },
        icon: {
            type: Number,
        },
        color: {
            type: String,
            required: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Type", typeSchema);
