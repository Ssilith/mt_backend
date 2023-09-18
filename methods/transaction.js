const Transaction = require("../models/transaction");
const User = require("../models/user");
const Category = require("../models/category");
const mongoose = require("mongoose");

var functions = {
    addNewTransaction: async function (req, res) {
        try {
            let newTransaction = new Transaction(req.body.transaction);
            newTransaction = await newTransaction.save();
            return res.status(200).send({ success: true, transaction: newTransaction });
        } catch (e) {
            console.log(e);
            return res.status(500).send({ success: false, msg: e });
        }
    },

    updateTransaction: async function (req, res) {
        try {
            let updatedTransaction = await Transaction.findByIdAndUpdate(
                req.body.transaction._id,
                req.body.transaction,
                { new: true }
            );

            if (!updatedTransaction) {
                return res
                    .status(500)
                    .send({ success: false, message: "notFound" });
            }

            return res
                .status(200)
                .send({ success: true, transaction: updatedTransaction });
        } catch (e) {
            console.log(e);
            return res.status(500).send({ success: false });
        }
    },

    getAllTransactionsForUser: async function (req, res) {
        try {
            let userId = req.params.userId;

            let user = await User.findById(userId);

            if (!user) {
                return res.status(500).send({ success: false, msg: "notFound" });
            }

            let transactions = await Transaction.aggregate([
                { $match: { _id: { $in: user.transactionId } } },
                { $sort: { date: -1 } },
                {
                    $lookup: {
                        from: "categories",
                        localField: "category",
                        foreignField: "_id",
                        as: "category"
                    }
                },
                {
                    $unwind: "$category"
                }
            ]);

            return res.status(200).send({ success: true, transactions: transactions });
        } catch (e) {
            console.log(e);
            return res.status(500).send({ success: false, msg: e.message });
        }
    },

    getLastTenTransactionsForUser: async function (req, res) {
        try {
            let userId = req.params.userId;

            let user = await User.findById(userId);

            if (!user) {
                return res.status(500).send({ success: false, msg: "notFound" });
            }

            let transactions = await Transaction.aggregate([
                { $match: { _id: { $in: user.transactionId } } },
                { $sort: { date: -1 } },
                { $limit: 10 },
                {
                    $lookup: {
                        from: "categories",
                        localField: "category",
                        foreignField: "_id",
                        as: "category"
                    }
                },
                {
                    $unwind: "$category"
                }
            ]);
            console.log(transactions);
            return res.status(200).send({ success: true, transaction: transactions });
        } catch (e) {
            console.log(e);
            return res.status(500).send({ success: false, msg: e.message });
        }
    }


};

module.exports.functions = functions;