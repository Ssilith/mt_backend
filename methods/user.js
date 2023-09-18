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
            if (!token) throw new Error("Refresh token not found");

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

            private.sendNewAccountEmail(req, res, newUser);
            // return res.status(200).send({ success: true });
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
            body: "Wybierz nowe hasło dla",
            hint: "Wpisz nowe hasło",
            hintConfirm: "Potwierdź nowe hasło",
            buttonText: "Zresetuj hasło",
            pwdMismatchErrorMsg: "Hasła nie są takie same",
            pwdEmptyMsg: "Należy uzupełnić pola",
            email: new URL(fullUrl).searchParams.get("email"),
            url: protocol + "://" + req.get("host") + "/resetPassword",
            imageLink:
                "https://drive.google.com/uc?export=download&id=1AYmKaBS_lio75tqpeX0sRTuEkdSel59D",
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
                title: "Zmiana hasła zakończona pomyślnie.",
                msg: "Możesz się zalogować nowym hasłem.",
            });
        } catch (e) {
            return res.status(500).send({
                success: false,
                msg: "Wystąpił błąd podczas zmiany hasła. Spróbuj jeszcze raz.",
            });
        }
    },
    getAllUsernames: async function (req, res) {
        try {
            let usernameAll = await User.distinct("username");
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
                    from: "moneytracker.biuro@gmail.com",
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
                    title: "Problem z logowaniem?",
                    name: user.name,
                    body: "Ktoś poprosił o nowe hasło do konta aplikacji Money Tracker przypisanego do tego adresu e-mail.",
                    buttonText: "Naciśnij, aby zresetować hasło",
                    footText:
                        "Jeśli nie prosiłeś(-aś) o zresetowanie hasła, zignoruj tę wiadomość e-mail.",
                    footText2:
                        "Ten e-mail został wysłany z nienadzorowanej skrzynki pocztowej.",
                    resetLink:
                        protocol +
                        "://" +
                        req.get("host") +
                        "/resetPasswordRender?email=" +
                        user.email,
                    imageLink:
                        "https://drive.google.com/uc?export=download&id=1AYmKaBS_lio75tqpeX0sRTuEkdSel59D",
                },
            });
            res.status(200).send({
                success: true,
                key: "resetPwdEmailSent",
                user: user,
            });
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
                    from: "moneytracker.biuro@gmail.com",
                },
                preview: false,
                send: true,
                transport: transporter,
            });
            await email.send({
                template: "new_account_email",
                message: {
                    to: user.email,
                },
                locals: {
                    title: "Konto użytkownika zostało utworzone",
                    name: user.email,
                    body: "Możesz teraz zalogować się do aplikacji Money Tracker.",
                    buttonText: "Otwórz stronę aplikacji",
                    footText:
                        "Ten e-mail został wysłany z nienadzorowanej skrzynki pocztowej.",
                    footText2:
                        "Otrzymujesz tę wiadomość e-mail, ponieważ Ty lub ktoś utworzył nowe konto przy użyciu Twojego adresu e-mail.",
                    pageLink: "https://play.google.com/store/games?device=windows&pli=1",
                    imageLink:
                        "https://drive.google.com/uc?export=download&id=1AYmKaBS_lio75tqpeX0sRTuEkdSel59D",
                },
            });
            res.status(200).send({
                success: true,
                key: "newAccountMailSent",
                user: user,
            });
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
