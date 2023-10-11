const Budget = require("../models/budget");
const User = require("../models/user");
const Transaction = require("../models/transaction");

var functions = {
    addNewBudget: async function (req, res) {
        try {
            let userId = req.params.userId;

            let user = await User.findById(userId);

            if (!user) {
                return res.status(500).send({ success: false, msg: "notFound" });
            }

            let { startDate, endDate } = req.body.budget;

            let overlappingBudgets = await Budget.find({
                _id: { $in: user.budgetId },
                $or: [
                    { startDate: { $lte: startDate }, endDate: { $gte: startDate } },
                    { startDate: { $lte: endDate }, endDate: { $gte: endDate } },
                    { startDate: { $gte: startDate }, endDate: { $lte: endDate } }
                ]
            });

            if (overlappingBudgets.length > 0) {
                return res.status(400).send({ success: false, msg: 'budgetOverlaps' });
            }

            let newBudget = new Budget(req.body.budget);
            newBudget = await newBudget.save();
            console.log(newBudget);
            return res.status(200).send({ success: true, budget: newBudget });
        } catch (e) {
            console.log(e);
            return res.status(500).send({ success: false, msg: e });
        }
    },


    updateBudget: async function (req, res) {
        try {
            let { startDate, endDate, _id } = req.body.budget;

            let budget = await Budget.findById(_id);
            if (!budget) {
                return res.status(500).send({ success: false, message: "budgetNotFound" });
            }

            let user = await User.findById(req.body.userId);
            if (!user) {
                return res.status(500).send({ success: false, message: "userNotFound" });
            }

            let overlappingBudgets = await Budget.find({
                _id: { $in: user.budgetId, $ne: _id },
                $or: [
                    { startDate: { $lte: startDate }, endDate: { $gte: startDate } },
                    { startDate: { $lte: endDate }, endDate: { $gte: endDate } },
                    { startDate: { $gte: startDate }, endDate: { $lte: endDate } }
                ]
            });

            if (overlappingBudgets.length > 0) {
                return res.status(400).send({ success: false, message: 'budgetOverlaps' });
            }

            let updatedBudget = await Budget.findByIdAndUpdate(
                _id,
                req.body.budget,
                { new: true }
            );

            if (!updatedBudget) {
                return res.status(500).send({ success: false, message: "notFound" });
            }

            return res.status(200).send({ success: true, budget: updatedBudget });
        } catch (e) {
            console.log(e);
            return res.status(500).send({ success: false });
        }
    },


    getCurrentBudget: async function (req, res) {
        try {
            let userId = req.params.userId;

            let user = await User.findById(userId);

            if (!user) {
                return res.status(500).send({ success: false, msg: "notFound" });
            }

            let today = new Date();
            today.setHours(0, 0, 0, 0);

            let utcToday = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));

            let currentBudget = await Budget.findOne({
                _id: { $in: user.budgetId },
                startDate: { $lte: utcToday },
                endDate: { $gte: utcToday }
            });

            if (!currentBudget) {
                return res.status(500).send({ success: false, msg: 'notFound' });
            }

            let transactions = await Transaction.find({
                _id: { $in: user.transactionId },
                date: { $gte: currentBudget.startDate, $lte: currentBudget.endDate }
            });

            let transactionAmountSum = transactions.reduce((sum, transaction) => {
                if (transaction.type === 'Wydatek') {
                    return sum + transaction.amount;
                }
                return sum;
            }, 0);

            let remainingAmount = currentBudget.amount - transactionAmountSum;


            let aggregatedTransactions = await Transaction.aggregate([
                {
                    $match: {
                        type: "Wydatek",
                        date: { $gte: currentBudget.startDate, $lte: currentBudget.endDate },
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

            let percentage = (transactionAmountSum / currentBudget.amount) * 100;

            let over90 = percentage >= currentBudget.notification.budgetValue;
            let over100 = percentage >= currentBudget.notification.budgetOver;

            return res.status(200).send({
                success: true, budget: currentBudget, leftAmount: remainingAmount, spentAmount: transactionAmountSum, categories: results, totalExpense, over90, over100
            });

        } catch (e) {
            return res.status(500).send({ success: false, msg: e });
        }
    }

};

module.exports.functions = functions;