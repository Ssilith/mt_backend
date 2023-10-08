const express = require("express");
const router = express.Router();
const { verify } = require("../methods/middleware");
const user = require("../methods/user").functions;
const general = require("../methods/general");
const budget = require("../methods/budget").functions;
const transaction = require("../methods/transaction").functions;
const category = require("../methods/category").functions;

//##########################		GENERAL		##########################
router.post("/cleardb", general.cleardb);

//##########################		USER		##########################
router.post("/addUser", user.addNew);

router.post("/authenticate", user.authenticate);

router.post("/confirmIdentity", verify, user.confirmIdentity);

router.post("/refreshToken", user.refreshToken);

router.delete("/logout", user.logout);

router.get("/getUserInfo", verify, user.getUserInfo);

router.get("/getUsersForAdmin", verify, user.getUsersForAdmin);

router.post("/updateUserInfo", verify, user.updateUserInfo);

router.post("/sendResetPwdEmail", user.sendResetPwdEmail);

router.get("/resetPasswordRender", user.resetPasswordRender);

router.post("/resetPassword", user.resetPassword);

router.post("/getUserId", user.getUserId);

router.delete("/:userId/deleteAccount", user.deleteAccount);

// ################################# BUDGET #################################
router.post("/budget/:userId/addNewBudget", verify, budget.addNewBudget);

router.post("/budget/updateBudget", verify, budget.updateBudget);

router.get("/budget/:userId/getCurrentBudget", verify, budget.getCurrentBudget);

// ############################### TRANSACTION ##############################
router.post("/transaction/addNewTransaction", verify, transaction.addNewTransaction);

router.post("/transaction/updateTransaction", verify, transaction.updateTransaction);

router.get("/transaction/:userId/getAllTransactionsForUser", verify, transaction.getAllTransactionsForUser);

router.get("/transaction/:userId/getLastTenTransactionsForUser", verify, transaction.getLastTenTransactionsForUser);

router.get("/transaction/:userId/getLastWeekTopCategories", verify, transaction.getLastWeekTopCategories);

router.get("/transaction/:userId/getBiggestTransactionAmount", verify, transaction.getBiggestTransactionAmount);

router.get("/transaction/:userId/getMonthlySummary", verify, transaction.getMonthlySummary);

router.get("/transaction/:userId/getYearlySummary", verify, transaction.getYearlySummary);

router.get("/transaction/:userId/getMonthlySummaryCostAndIncome", verify, transaction.getMonthlySummaryCostAndIncome);

//##########################		CATEGORY		##########################
router.post("/category/addCategory", verify, category.addCategory);

router.post("/category/updateCategory", verify, category.updateCategory);

router.post("/category/:userId/getCategories", verify, category.getCategories);

router.post("/category/:userId/getCategoriesNames", verify, category.getCategoriesNames);

router.post("/category/getCategoryIdByName", verify, category.getCategoryIdByName);

module.exports = router;
