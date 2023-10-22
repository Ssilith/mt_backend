const Transaction = require("../models/transaction");
const User = require("../models/user");
const Category = require("../models/category");
const Type = require("../models/type");
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

            for (let transaction of transactions) {
                if (mongoose.Types.ObjectId.isValid(transaction.type)) {
                    let type = await Type.findById(transaction.type);
                    transaction.transactionType = type;
                }
            }

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

            for (let transaction of transactions) {
                if (mongoose.Types.ObjectId.isValid(transaction.type)) {
                    let type = await Type.findById(transaction.type);
                    transaction.transactionType = type;
                }
            }

            return res.status(200).send({ success: true, transaction: transactions });
        } catch (e) {
            console.log(e);
            return res.status(500).send({ success: false, msg: e.message });
        }
    },

    getLastWeekTopCategories: async function (req, res) {
        try {
            let userId = req.params.userId;

            let user = await User.findById(userId);

            if (!user) {
                return res.status(500).send({ success: false, msg: "notFound" });
            }

            let oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

            let aggregatedTransactions = await Transaction.aggregate([
                {
                    $match: {
                        type: "Wydatek",
                        date: { $gte: oneWeekAgo },
                        _id: { $in: user.transactionId },
                    },
                },
                {
                    $group: {
                        _id: "$category",
                        totalAmount: { $sum: "$amount" },
                    },
                },
                {
                    $sort: { totalAmount: -1 },
                },
                {
                    $lookup: {
                        from: "categories",
                        localField: "_id",
                        foreignField: "_id",
                        as: "categoryInfo"
                    }
                },
                {
                    $unwind: "$categoryInfo"
                }
            ]);

            let totalExpense = aggregatedTransactions.reduce((acc, cur) => acc + cur.totalAmount, 0);

            let results = [];
            let remainingPercent = 100;
            let remainigExpense = totalExpense;

            for (let i = 0; i < aggregatedTransactions.length; i++) {
                let categoryExpense = aggregatedTransactions[i];

                if (i < 4) {
                    let percentage = (categoryExpense.totalAmount / totalExpense) * 100;
                    results.push({
                        category: categoryExpense.categoryInfo.name,
                        color: categoryExpense.categoryInfo.color,
                        percentage: percentage.toFixed(2),
                        expense: categoryExpense.totalAmount.toFixed(2),
                    });
                    remainingPercent -= percentage;
                    remainigExpense -= categoryExpense.totalAmount;
                }
            }

            if (aggregatedTransactions.length > 4) {
                results.push({
                    category: "Inne",
                    color: "0xFF000000",
                    percentage: remainingPercent.toFixed(2),
                    expense: remainigExpense.toFixed(2),
                });
            }

            return res.status(200).send({ success: true, categories: results, totalExpense });
        } catch (e) {
            console.log(e);
            return res.status(500).send({ success: false, msg: e.toString() });
        }
    },

    getBiggestTransactionAmount: async function (req, res) {
        try {
            let userId = req.params.userId;
            let user = await User.findById(userId);

            if (!user) {
                return res.status(500).send({ success: false, msg: "notFound" });
            }

            let aggregatedTransactions = await Transaction.aggregate([
                { $match: { _id: { $in: user.transactionId } } },
                { $sort: { amount: -1 } },
                { $limit: 1 }
            ]);

            let biggestTransaction = aggregatedTransactions[0];
            return res.status(200).send({ success: true, transaction: biggestTransaction });
        } catch (e) {
            console.log(e);
            return res.status(500).send({ success: false, msg: e });
        }
    },

    getMonthlySummary: async function (req, res) {
        try {
            let userId = req.params.userId;
            let user = await User.findById(userId);

            if (!user) {
                return res.status(500).send({ success: false, msg: "notFound" });
            }

            let currentDate = new Date();
            let startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
            let endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59, 999);

            let aggregatedTransactions = await Transaction.aggregate([
                { $match: { _id: { $in: user.transactionId } } },
                { $match: { date: { $gte: startOfMonth, $lte: endOfMonth } } },
                {
                    $group: {
                        _id: "$type",
                        totalAmount: { $sum: "$amount" }
                    }
                }
            ]);

            let summary = {
                costs: aggregatedTransactions.find(t => t._id === "Wydatek")?.totalAmount || 0,
                income: aggregatedTransactions.find(t => t._id === "Przychód")?.totalAmount || 0
            }

            return res.status(200).send({ success: true, summary });
        } catch (e) {
            console.log(e);
            return res.status(500).send({ success: false, msg: e });
        }
    },

    getYearlySummary: async function (req, res) {
        try {
            let monthNamesPL = [
                "Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec",
                "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień"
            ];

            let userId = req.params.userId;
            let user = await User.findById(userId);

            if (!user) {
                return res.status(500).send({ success: false, msg: "notFound" });
            }

            let currentYear = new Date().getFullYear();
            let startOfYear = new Date(currentYear, 0, 1);
            let endOfYear = new Date(currentYear, 11, 31, 23, 59, 59, 999);

            let aggregatedTransactions = await Transaction.aggregate([
                { $match: { _id: { $in: user.transactionId } } },
                { $match: { date: { $gte: startOfYear, $lte: endOfYear } } },
                { $group: { _id: { month: { $month: "$date" }, type: "$type" }, totalAmount: { $sum: "$amount" } } },
            ]);

            let summary = monthNamesPL.map((month, index) => {
                return {
                    month,
                    costs: aggregatedTransactions.find(t => t._id.month === index + 1 && t._id.type === "Wydatek")?.totalAmount || 0,
                    income: aggregatedTransactions.find(t => t._id.month === index + 1 && t._id.type === "Przychód")?.totalAmount || 0
                }
            });

            return res.status(200).send({ success: true, summary });
        } catch (e) {
            console.log(e);
            return res.status(500).send({ success: false, msg: e });
        }
    },

    getMonthlySummaryCostAndIncome: async function (req, res) {
        try {
            let currentYear = new Date().getFullYear();
            let currentMonth = new Date().getMonth() + 1;
            let startOfYear = new Date(currentYear, 0, 1);
            let endOfYear = new Date(currentYear, 11, 31, 23, 59, 59, 999);

            let userId = req.params.userId;
            let user = await User.findById(userId);

            if (!user) {
                return res.status(500).send({ success: false, msg: "notFound" });
            }


            let aggregatedTransactions = await Transaction.aggregate([
                { $match: { _id: { $in: user.transactionId } } },
                { $match: { date: { $gte: startOfYear, $lte: endOfYear } } },
                {
                    $group: {
                        _id: { month: { $month: "$date" }, type: "$type" },
                        totalAmount: { $sum: "$amount" },
                        count: { $sum: 1 }
                    }
                }
            ]);

            let monthlyAverage = {
                averageCost: aggregatedTransactions
                    .filter(t => t._id.type === "Wydatek")
                    .reduce((acc, t) => acc + t.totalAmount, 0) / 12,
                averageIncome: aggregatedTransactions
                    .filter(t => t._id.type === "Przychód")
                    .reduce((acc, t) => acc + t.totalAmount, 0) / 12
            };

            let thisMonth = {
                cost: aggregatedTransactions.find(t => t._id.month === currentMonth && t._id.type === "Wydatek")?.totalAmount || 0,
                income: aggregatedTransactions.find(t => t._id.month === currentMonth && t._id.type === "Przychód")?.totalAmount || 0
            };

            let summary = {
                monthlyAverage,
                thisMonth
            }

            return res.status(200).send({ success: true, summary });
        } catch (e) {
            console.log(e);
            return res.status(500).send({ success: false, msg: e });
        }
    },

    getYearlySummaryAndTransactions: async function (req, res) {
        try {
            let currentYear = new Date().getFullYear();
            let startOfYear = new Date(currentYear, 0, 1);
            let endOfYear = new Date(currentYear, 11, 31, 23, 59, 59, 999);

            let userId = req.params.userId;
            let user = await User.findById(userId);

            if (!user) {
                return res.status(500).send({ success: false, msg: "notFound" });
            }

            let allTypes = await Type.find({});

            let aggregatedTransactions = await Transaction.aggregate([
                { $match: { _id: { $in: user.transactionId } } },
                { $match: { date: { $gte: startOfYear, $lte: endOfYear } } },
                {
                    $group: {
                        _id: { month: { $month: "$date" }, categoryId: "$category", type: "$type" },
                        totalAmount: { $sum: "$amount" }
                    }
                },
                {
                    $lookup: {
                        from: "categories",
                        localField: "_id.categoryId",
                        foreignField: "_id",
                        as: "categoryData"
                    }
                },
                {
                    $unwind: "$categoryData"
                }
            ]);

            let monthlyData = [];
            let yearlyIncome = 0;
            let yearlyCost = 0;

            for (let month = 1; month <= 12; month++) {
                let monthData = {
                    month: month,
                    costs: [],
                    totalCost: 0,
                    incomes: [],
                    totalIncome: 0,
                    otherTypes: {}
                };

                allTypes.forEach(typeObj => {
                    monthData.otherTypes[typeObj.name] = { total: 0, breakdown: [] };
                });

                aggregatedTransactions.forEach(transaction => {
                    if (transaction._id.month === month) {
                        let categoryName = transaction.categoryData.name;
                        let typeName = transaction._id.type;

                        if (mongoose.Types.ObjectId.isValid(typeName)) {
                            let typeObj = allTypes.find(t => t._id.toString() === typeName);
                            typeName = typeObj ? typeObj.name : "Nieznane";
                        }

                        if (typeName === "Wydatek" && transaction.totalAmount !== 0) {
                            monthData.costs.push({ categoryName, amount: transaction.totalAmount });
                            monthData.totalCost += transaction.totalAmount;
                        } else if (typeName === "Przychód" && transaction.totalAmount !== 0) {
                            monthData.incomes.push({ categoryName, amount: transaction.totalAmount });
                            monthData.totalIncome += transaction.totalAmount;
                        } else if (monthData.otherTypes[typeName]) { // Handle other types
                            monthData.otherTypes[typeName].total += transaction.totalAmount;
                            monthData.otherTypes[typeName].breakdown.push({ categoryName, amount: transaction.totalAmount });
                        }
                    }
                });

                monthlyData.push(monthData);
                yearlyIncome += monthData.totalIncome;
                yearlyCost += monthData.totalCost;
            }

            let responseData = {
                success: true,
                monthlyData,
                yearlySummary: {
                    totalIncome: yearlyIncome,
                    totalCost: yearlyCost
                }
            };

            return res.status(200).send(responseData);

        } catch (e) {
            console.log(e);
            return res.status(500).send({ success: false, msg: e });
        }
    },

};

module.exports.functions = functions;