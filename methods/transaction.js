const Transaction = require("../models/transaction");
const User = require("../models/user");

var functions = {
    addNewTransaction: async function (req, res) {
        try {
            let newTransaction = new Transaction(req.body.transaction);
            newTransaction = await newTransaction.save();
            console.log(newTransaction);
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
};

module.exports.functions = functions;