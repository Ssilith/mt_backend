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
            let updatedBudget = await Budget.findByIdAndUpdate(
                req.body.budget._id,
                req.body.budget,
                { new: true }
            );

            if (!updatedBudget) {
                return res
                    .status(500)
                    .send({ success: false, message: "notFound" });
            }

            return res
                .status(200)
                .send({ success: true, budget: updatedBudget });
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

            let currentBudget = await Budget.findOne({
                _id: { $in: user.budgetId },
                startDate: { $lte: today },
                endDate: { $gte: today }
            });

            if (!currentBudget) {
                return res.status(500).send({ success: false, msg: 'notFound' });
            }

            let transactions = await Transaction.find({
                _id: { $in: user.transactionId },
                date: { $gte: currentBudget.startDate, $lte: currentBudget.endDate }
            });

            let transactionAmountSum = transactions.reduce((sum, transaction) => {
                if (currentBudget.income) {
                    return sum + transaction.amount;
                } else if (transaction.type === 'Wydatek') {
                    return sum + transaction.amount;
                }
                return sum;
            }, 0);

            let remainingAmount = currentBudget.amount - transactionAmountSum;
            return res.status(200).send({ success: true, budget: currentBudget, leftAmount: remainingAmount, spentAmount: transactionAmountSum });

        } catch (e) {
            return res.status(500).send({ success: false, msg: e });
        }
    }

};

module.exports.functions = functions;