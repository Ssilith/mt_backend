const mongoose = require("mongoose");

var notificationSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            trim: true,
            required: true,
        },
        date: {
            type: Date,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
