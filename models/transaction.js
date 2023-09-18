const mongoose = require("mongoose");

var transactionSchema = new mongoose.Schema(
    {
        amount: {
            type: Number,
            trim: true,
            required: true,
        },
        type: {
            type: String,
            trim: true,
        },
        category: { type: mongoose.Schema.Types.ObjectId },
        date: {
            type: Date,
        },
        description: {
            type: String,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Transaction", transactionSchema);
