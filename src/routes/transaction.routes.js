const {Router} = require("express");
const authMiddleware = require("../middleware/auth.middleware");
const { createTransaction } = require("../controllers/transaction.controller");

const transactionRoutes = Router();

transactionRoutes.post("/", authMiddleware.authMiddleware, createTransaction);

module.exports = transactionRoutes;

