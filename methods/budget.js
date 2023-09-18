const Budget = require("../models/budget");
const User = require("../models/user");

var functions = {
    // addNewBudget: async function (req, res) {
    //     try {
    //         let newBudget = new Budget(req.body.budget);
    //         newBudget = await newBudget.save();
    //         console.log(newBudget);
    //         return res.status(200).send({ success: true, budget: newBudget });
    //     } catch (e) {
    //         console.log(e);
    //         return res.status(500).send({ success: false, msg: e });
    //     }
    // },

    addNewBudget: async function (req, res) {
        try {
            let { startDate, endDate } = req.body.budget;

            let overlappingBudgets = await Budget.find({
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
};

module.exports.functions = functions;