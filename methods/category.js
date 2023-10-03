const Category = require("../models/category");
const User = require("../models/user");
const mongoose = require("mongoose");

var functions = {
    addCategory: async function (req, res) {
        try {
            let cat = await Category.findOne({
                $or: [{ name: req.body.category.name }],
            });

            let categoryId = new mongoose.Types.ObjectId();
            let newCategory = await Category(req.body.category);
            newCategory._id = categoryId;
            newCategory = await newCategory.save();
            return res
                .status(200)
                .send({ success: true, newCategory: newCategory });
        } catch (e) {
            return res.status(500).send({ success: false });
        }
    },

    updateCategory: async function (req, res) {
        try {
            await Category.findByIdAndUpdate(
                req.body.id,
                req.body.category,
                {
                    new: true,
                }
            );
            return res
                .status(200)
                .send({ success: true, category: req.body.category });
        } catch (e) {
            console.log(e);
            return res.status(500).send({ success: false, msg: e });
        }
    },

    getCategories: async function (req, res) {
        try {
            let userId = req.params.userId;

            let user = await User.findById(userId);

            if (!user) {
                return res.status(500).send({ success: false, msg: "notFound" });
            }

            let category = await Category.find({ _id: { $in: user.categoryId }, });
            return res.status(200).send({ success: true, category: category });
        } catch (e) {
            return res.status(500).send({ success: false });
        }
    },

    getCategoriesNames: async function (req, res) {
        try {
            let userId = req.params.userId;

            let user = await User.findById(userId);

            if (!user) {
                return res.status(500).send({ success: false, msg: "notFound" });
            }

            let category = await Category.distinct("name", { _id: { $in: user.categoryId } });
            return res.status(200).send({ success: true, category: category });
        } catch (e) {
            return res.status(500).send({ success: false });
        }
    },

    getCategoriesId: async function (req, res) {
        try {
            let category = await Category.distinct("_id");
            return res.status(200).send({ success: true, category: category });
        } catch (e) {
            return res.status(500).send({ success: false });
        }
    },

    getCategoryIdByName: async function (req, res) {
        try {
            let cat = await Category.findOne({
                $or: [{ name: req.body.name }],
            });

            if (!cat) {
                return res
                    .status(500)
                    .send({ success: false, key: "notFound" });
            }

            return res
                .status(200)
                .send({ success: true, category: cat });
        } catch (e) {
            return res.status(500).send({ success: false });
        }
    },

};

module.exports.functions = functions;