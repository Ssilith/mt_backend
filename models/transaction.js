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
        category: {
            type: String,
            trim: true,
        },
        date: {
            type: Date,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Transaction", transactionSchema);
