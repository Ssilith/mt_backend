const mongoose = require("mongoose");

var notificationSchema = new mongoose.Schema(
    {
        content: {
            type: Number,
            trim: true,
            required: true,
        },
        type: {
            type: String,
            trim: true,
        },
        date: {
            type: Date,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
