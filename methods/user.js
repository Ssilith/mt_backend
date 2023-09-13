const User = require("../models/user");
const Token = require("../models/token");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const Email = require("email-templates");
const mailConfig = require("../config/mailconfig");

var functions = {
    authenticate: async function (req, res) {
        try {
            var user = await User.findOne({ email: req.body.email });

            if (!user)
                return res
                    .status(500)
                    .send({ success: false, key: "loginFailed" });

            //provvisory code to migrate user passwords -- remove once all users are migrated
            if (!user.password) {
                user.password = req.body.password;
                user = await user.save();
            }

            user.comparePassword(
                req.body.password,
                async function (err, isMatch) {
                    if (!isMatch || err)
                        return res
                            .status(403)
                            .send({ success: false, key: "loginFailed" });

                    let tokens = await private.generateTokens(user);

                    return res.status(200).json({
                        success: true,
                        accessToken: tokens.access,
                        refreshToken: tokens.refresh,
                    });
                }
            );
        } catch (e) {
            return res.status(500).send({ success: false, key: "loginFailed" });
        }
    },
    confirmIdentity: async function (req, res) {
        try {
            var user = await User.findOne({ email: req.body.email });

            if (!user)
                return res
                    .status(404)
                    .send({ success: false, key: "verificationFailed" });

            user.comparePassword(
                req.body.password,
                async function (err, isMatch) {
                    if (!isMatch || err)
                        return res.status(403).send({
                            success: false,
                            key: "verificationFailed",
                        });

                    let verificationToken = jwt.sign(
                        { _id: user._id },
                        process.env.JWT_ID_CONFIRM_SECRET,
                        { expiresIn: "3 minutes" }
                    );

                    return res.status(200).json({
                        success: true,
                        verificationToken: verificationToken,
                    });
                }
            );
        } catch (e) {
            return res
                .status(500)
                .send({ success: false, key: "verificationFailed" });
        }
    },
    refreshToken: async function (req, res) {
        try {
            if (!req.headers.refreshtoken)
                return res.status(403).send({ success: false });

            //Verify that token actually exists in the database
            const token = await Token.findOne({
                token: req.headers.refreshtoken,
            });
            if (!token) throw new Error("Refresh token not found"); //this will make the code jump to the catch clause

            const decodedToken = jwt.verify(
                req.headers.refreshtoken,
                process.env.JWT_REFRESH_SECRET
            );
            const accessToken = jwt.sign(
                { _id: decodedToken._id },
                process.env.JWT_ACCESS_SECRET,
                { expiresIn: "30 minutes" }
            );

            return res
                .status(200)
                .send({ success: true, accessToken: accessToken });
        } catch (e) {
            return res.status(403).send({ success: false });
        }
    },
    logout: async function (req, res) {
        try {
            await Token.deleteOne({ token: req.headers.refreshtoken });
            return res.status(200).send({ success: true });
        } catch (e) {
            return res.status(500).send({ success: false });
        }
    },
    addNew: async function (req, res) {
        try {
            console.log(req.body.newUser.email);
            let user = await User.findOne({
                $or: [{ email: req.body.newUser.email }],
            });

            if (user) {
                if (user.email == req.body.newUser.email)
                    return res
                        .status(500)
                        .send({ success: false, key: "emailUsed" });
            }

            let newUser = new User(req.body.newUser);
            newUser = await newUser.save();

            // private.sendNewAccountEmail(req, res, newUser);
            return res.status(200).send({ success: true });
        } catch (e) {
            console.log(e);
            return res.status(500).send({ success: false, msg: e });
        }
    },
    getUserInfo: async function (req, res) {
        try {
            return res.status(200).send({ success: true, user: req.body.user });
        } catch (e) {
            return res.status(500).send({ success: false });
        }
    },
    getUsersForAdmin: async function (req, res) {
        try {
            //remove admin user from users list
            let users = await User.find({}).sort(sortUsers);
            let adminIndex = users.findIndex((e) => e._id == req.body.user._id);
            if (adminIndex != -1) users.splice(adminIndex, 1);

            return res.status(200).send({ success: true, users: users });
        } catch (e) {
            return res.status(500).send({ success: false });
        }
    },
    updateUserInfo: async function (req, res) {
        try {
            let savedUser = await User.findOneAndUpdate(
                { _id: req.body.updatedUser._id },
                req.body.updatedUser,
                { new: true }
            );
            return res.status(200).send({ success: true });
        } catch (e) {
            return res.status(500).send({ success: false });
        }
    },
    sendResetPwdEmail: async function (req, res) {
        try {
            let user = await User.findOne({ email: req.body.email });
            if (!user)
                return res
                    .status(500)
                    .send({ success: false, key: "emailNotFound" });

            private.sendResetPasswordEmail(req, res, user);
        } catch (e) {
            return res.status(500).send({ success: false, msg: err });
        }
    },
    resetPasswordRender: function (req, res) {
        var protocol = req.secure ? "https" : "http";
        var fullUrl = protocol + "://" + req.get("host") + req.originalUrl;
        res.render("reset_password_page", {
            title: "RenX App",
            body: "Choose a new password for",
            hint: "Enter New Password",
            hintConfirm: "Confirm New Password",
            buttonText: "Reset Password Now",
            pwdEmptyErrorMsg: "Password must be at least 11 characters long",
            pwdMismatchErrorMsg: "Passwords do not match",
            email: new URL(fullUrl).searchParams.get("email"),
            url: protocol + "://" + req.get("host") + "/resetPassword",
            imageLink:
                "https://www.renx-italia.com/wp-content/uploads/2022/05/Obraz1.webp",
            //imageLink: protocol + "://" + req.get("host") + "/images/renx_logo.png",
        });
    },
    resetPassword: async function (req, res) {
        try {
            var user = await User.findOne({ email: req.body.email });
            user.password = req.body.password;

            await user.save();
            private.logoutAll(user._id);

            return res.status(200).send({
                success: true,
                title: "Password changed successfully",
                msg: "You can now login using your new password.",
            });
        } catch (e) {
            return res.status(500).send({
                success: false,
                msg: "Error while saving your new password. Please try again",
            });
        }
    },
    getAllUsernames: async function (req, res) {
        try {
            let usernameAll = await User.distinct("username");
            //console.log(usernameAll);
            return res
                .status(200)
                .send({ success: true, usernameAll: usernameAll });
        } catch (e) {
            return res.status(500).send({ success: false });
        }
    },
    getUserId: async function (req, res) {
        try {
            var user = await User.findOne({ username: req.body.username });
            return res.status(200).send({ success: true, id: user._id });
        } catch (e) {
            return res.status(500).send({ success: false });
        }
    },
};
var private = {
    generateTokens: async function (user) {
        let refreshToken = jwt.sign(
            { _id: user._id, email: user.email },
            process.env.JWT_REFRESH_SECRET
        );
        let dbRefreshToken = new Token({
            userId: user._id,
            token: refreshToken,
        });
        await dbRefreshToken.save();

        let accessToken = jwt.sign(
            { _id: user._id },
            process.env.JWT_ACCESS_SECRET,
            { expiresIn: "30 minutes" }
        );

        return {
            refresh: refreshToken,
            access: accessToken,
        };
    },
    sendResetPasswordEmail: async function (req, res, user) {
        try {
            var protocol = req.secure ? "https" : "http";
            var transporter = nodemailer.createTransport(mailConfig);
            const email = new Email({
                views: { root: "./views", options: { extension: "ejs" } },
                message: {
                    from: "noreply.renx@gmail.com",
                },
                preview: false,
                send: true,
                transport: transporter,
            });
            await email.send({
                template: "reset_password_email",
                message: {
                    to: user.email,
                },
                locals: {
                    title: "Trouble singing in?",
                    name: user.name,
                    body: "Somebody requested a new password for RenX App account attached to this e-mail.",
                    buttonText: "Press to reset your password",
                    footText:
                        "If you did not request a password reset, please ignore this email.",
                    footText2:
                        "This email was sent from an unmonitored mailbox.",
                    resetLink:
                        protocol +
                        "://" +
                        req.get("host") +
                        "/resetPasswordRender?email=" +
                        user.email,
                    imageLink:
                        "https://www.renx-italia.com/wp-content/uploads/2022/05/Obraz1.webp",
                    // protocol + "://" + req.get("host") + "/images/renx_logo.png",
                },
            });
            res.status(200).send({ success: true, key: "resetPwdEmailSent" });
        } catch (e) {
            console.log(e);
            res.status(500).send({ success: false });
        }
    },
    sendNewAccountEmail: async function (req, res, user) {
        try {
            var transporter = nodemailer.createTransport(mailConfig);
            const email = new Email({
                views: { root: "./views", options: { extension: "ejs" } },
                message: {
                    from: "noreply.renx@gmail.com",
                },
                preview: false,
                send: true,
                transport: transporter,
            });
            await email.send({
                template: "new_account_email",
                message: {
                    to: user.email + ";" + req.body.user.email,
                },
                locals: {
                    title: "A user account has been created",
                    name: user.email,
                    password: req.body.newUser.password,
                    body: "You can now sing in to the ZF App",
                    body2: "Once you or other users have signed in with their temporary password, they can create their own by following the instructions on the sign in page.",
                    buttonText: "Open ZF app page",
                    footText:
                        "This email was sent from an unmonitored mailbox.",
                    footText2:
                        "You are receiving this email because you created a new account or somebody created account with your email address.",
                    pageLink: "https://renx-database.web.app/",
                    imageLink:
                        "https://www.renx-italia.com/wp-content/uploads/2022/05/Obraz1.webp",
                    // protocol + "://" + req.get("host") + "/images/renx_logo.png",
                },
            });
            res.status(200).send({ success: true, key: "newAccountMailSent" });
        } catch (e) {
            console.log(e);
            res.status(500).send({ success: false });
        }
    },
    logoutAll: async function (userId) {
        await Token.deleteMany({
            userId: userId,
        });
    },
};

module.exports.functions = functions;
