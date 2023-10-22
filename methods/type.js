const Type = require("../models/type");
const User = require("../models/user");

var functions = {
    addNewType: async function (req, res) {
        try {
            let newType = new Type(req.body.type);
            newType = await newType.save();

            console.log(newType);
            return res.status(200).send({ success: true, type: newType });
        } catch (e) {
            console.log(e);
            return res.status(500).send({ success: false, msg: e });
        }
    },

    getTypes: async function (req, res) {
        try {
            let userId = req.params.userId;

            let user = await User.findById(userId);

            if (!user) {
                return res.status(500).send({ success: false, msg: "notFound" });
            }

            let type = await Type.find({ _id: { $in: user.typeId }, });
            // let typeNames = type.distinct("name");

            return res.status(200).send({ success: true, type: type });
        } catch (e) {
            return res.status(500).send({ success: false });
        }
    },

    getTypesNames: async function (req, res) {
        try {
            let userId = req.params.userId;

            let user = await User.findById(userId);

            if (!user) {
                return res.status(500).send({ success: false, msg: "notFound" });
            }

            let typeNames = await Type.distinct("name", { _id: { $in: user.typeId } });

            return res.status(200).send({ success: true, type: typeNames });
        } catch (e) {
            console.log(e);
            return res.status(500).send({ success: false });
        }
    },

    getTypeIdByName: async function (req, res) {
        try {
            let cat = await Type.findOne({
                $or: [{ name: req.body.name }],
            });

            if (!cat) {
                return res
                    .status(500)
                    .send({ success: false, key: "notFound" });
            }

            return res
                .status(200)
                .send({ success: true, type: cat });
        } catch (e) {
            return res.status(500).send({ success: false });
        }
    },
};

module.exports.functions = functions;
