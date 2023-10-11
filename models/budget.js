const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
    {
        budgetValue: {
            type: Number,
            required: true,
        },
        sentBudgetValue: {
            type: Boolean,
            default: false,
        },
        budgetOver: {
            type: Number,
            required: true,
        },
        sentBudgetOver: {
            type: Boolean,
            default: false,
        },
    }, { timestamps: true });

var budgetSchema = new mongoose.Schema(
    {
        amount: {
            type: Number,
            trim: true,
            required: true,
        },
        startDate: {
            type: Date,
        },
        endDate: {
            type: Date,
        },
        notification: { type: notificationSchema },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Budget", budgetSchema);
