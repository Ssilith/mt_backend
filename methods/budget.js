const Budget = require("../models/budget");
const User = require("../models/user");

var functions = {
    addNewBudget: async function (req, res) {
        try {
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