const express = require("express");
const router = express.Router();
const { verify } = require("../methods/middleware");
const user = require("../methods/user").functions;
const general = require("../methods/general");
const budget = require("../methods/budget").functions;
const transaction = require("../methods/transaction").functions;

router.post("/cleardb", general.cleardb);

//##########################		USER		##########################

//@desc Adding a new user
//@route POST /adduser
router.post("/addUser", user.addNew);

//@desc Authenticate a user
//@route POST /authenticate
router.post("/authenticate", user.authenticate);

//@desc Confirm the identity of the user by verifying his credentials,
//if correct return short-lived jwt to be used in request that requires identity confirmation
//@route POST /confirmIdentity
router.post("/confirmIdentity", verify, user.confirmIdentity);

//@desc Check current access token, if expired generate new access token using refresh token
//@route POST /refreshToken
router.post("/refreshToken", user.refreshToken);

//@desc Logout user
//@route DELETE /logout
router.delete("/logout", user.logout);

//@desc Get user informations
//@route GET /getinfo
router.get("/getUserInfo", verify, user.getUserInfo);

//@desc Get a list of all users sorted alphabetically by username, to be used in admin panel
//@route GET /getUsersForAdmin
router.get("/getUsersForAdmin", verify, user.getUsersForAdmin);

//@desc Update user anagraphic informations
//@route POST /updateUserInfo
router.post("/updateUserInfo", verify, user.updateUserInfo);

//@desc Send password reset email
//@route POST /sendResetPwdEmail
router.post("/sendResetPwdEmail", user.sendResetPwdEmail);

//@desc Render Reset password page
//@route POST /resetPasswordRender
router.get("/resetPasswordRender", user.resetPasswordRender);

//@desc Reset password
//@route POST /resetPassword
router.post("/resetPassword", user.resetPassword);

router.post("/getUserId", user.getUserId);

// ################################# BUDGET #################################
router.post("/budget/addNewBudget", verify, budget.addNewBudget);

router.post("/budget/updateBudget", verify, budget.updateBudget);

// ############################### TRANSACTION ##############################
router.post("/transaction/addNewTransaction", verify, transaction.addNewTransaction);

router.post("/transaction/updateTransaction", verify, transaction.updateTransaction);

module.exports = router;
