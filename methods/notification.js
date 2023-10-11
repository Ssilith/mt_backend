const Notification = require("../models/notification");
const User = require("../models/user");

var functions = {
    addNewNotification: async function (req, res) {
        try {
            let newNotification = new Notification(req.body.notification);
            newNotification = await newNotification.save();

            console.log(newNotification);
            return res.status(200).send({ success: true, notification: newNotification });
        } catch (e) {
            console.log(e);
            return res.status(500).send({ success: false, msg: e });
        }
    },

    updateNotification: async function (req, res) {
        try {
            let updatedNotification = await Notification.findByIdAndUpdate(
                req.body.notification._id,
                req.body.notification,
                { new: true }
            );

            if (!updatedNotification) {
                return res
                    .status(500)
                    .send({ success: false, message: "notFound" });
            }

            return res
                .status(200)
                .send({ success: true, notification: updatedNotification });
        } catch (e) {
            console.log(e);
            return res.status(500).send({ success: false });
        }
    },

    getNotifications: async function (req, res) {
        try {
            let userId = req.params.userId;

            let user = await User.findById(userId);

            if (!user) {
                return res.status(500).send({ success: false, msg: "notFound" });
            }

            let notification = await Notification.find({ _id: { $in: user.notificationId }, });
            return res.status(200).send({ success: true, notification: notification });
        } catch (e) {
            return res.status(500).send({ success: false });
        }
    },
};

module.exports.functions = functions;
