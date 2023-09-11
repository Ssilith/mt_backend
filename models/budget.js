const mongoose = require("mongoose");

var budgetSchema = new mongoose.Schema(
    {
        amount: {
            type: Number,
            trim: true,
            required: true,
        },
        category: {
            type: String,
            trim: true,
        },
        startDate: {
            type: Date,
        },
        endDate: {
            type: Date,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Budget", budgetSchema);
