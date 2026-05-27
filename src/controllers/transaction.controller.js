/**
 * - Create a new transaction
 * THE 10-STEP TRANSFER FLOW:
 *   1. Validate request
 *   2. Validate idempotency key
 *   3. Check account status
 *   4. Derive sender balance from ledger
 *   5. Create transaction (PENDING)
 *   6. Create DEBIT ledger entry
 *   7. Create CREDIT ledger entry
 *   8. Mark transaction COMPLETED
 *   9. Commit MongoDB session
 *  10. Send email notification
 */

const transactionModel = require("../models/transaction.model");
const ledgerModel = require("../models/ledger.model");
const emailService = require("../services/email.service")
const accountModel = require("../models/account.model")


async function createTransaction(req, res){
    const mongoose = require("mongoose");

    // 1. validate request
    const {fromAccount, toAccount, amount, idempotencyKey} = req.body;
    if(!fromAccount || !toAccount || !amount || !idempotencyKey){
        return res.status(400).json({
            message: "fromAccount, toAccount, amount, idempotencyKey are required"
        })
    }

    if(fromAccount === toAccount){
        return res.status(400).json({
            message: "sender and receiver accounts cannot be the same"
        })
    }

    if(typeof amount !== "number" || amount <= 0){
        return res.status(400).json({
            message: "transaction amount must be a positive number"
        })
    }

    const fromUserAccount = await accountModel.findById(fromAccount).populate("user");
    const toUserAccount = await accountModel.findById(toAccount).populate("user");

    if(!fromUserAccount || !toUserAccount){
        return res.status(400).json({
            message: "to and from account are invalid"
        })
    }

    // 2. validate idempotency key
    const isTransactionAlreadyExists = await transactionModel.findOne({
        idempotencyKey: idempotencyKey
    })

    if(isTransactionAlreadyExists){
        if(isTransactionAlreadyExists.status === "COMPLETED"){
            return res.status(200).json({
                message: "transaction processed",
                transaction: isTransactionAlreadyExists
            })
        }

        if(isTransactionAlreadyExists.status === "PENDING"){
            return res.status(200).json({
                message: "transaction is still in progress"
            })
        }

        if(isTransactionAlreadyExists.status === "FAILED"){
            return res.status(500).json({
                message: "transaction processing failed"
            })
        }

        if(isTransactionAlreadyExists.status === "REVERSED"){
            return res.status(500).json({
                message: "please re-try"
            })
        }
    }

    // 3. check account status
    if(fromUserAccount.status !== "Active" || toUserAccount.status !== "Active"){
        return res.status(400).json({
            message: "both to and from account must be active"
        })
    }

    // Start MongoDB Session for transaction atomicity
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // 4. derive sender balance from ledger
        const balance = await fromUserAccount.getBalance(session);
        if(balance < amount){
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({
                message: "Insufficient balance"
            });
        }

        // 5. Create transaction (PENDING)
        const [transaction] = await transactionModel.create(
            [
                {
                    fromAccount: fromAccount,
                    toAccount: toAccount,
                    amount: amount,
                    idempotencyKey: idempotencyKey,
                    status: "PENDING"
                }
            ],
            { session }
        );

        // 6. Create DEBIT ledger entry
        await ledgerModel.create(
            [
                {
                    account: fromAccount,
                    amount: amount,
                    transaction: transaction._id,
                    type: "DEBIT"
                }
            ],
            { session }
        );

        // 7. Create CREDIT ledger entry
        await ledgerModel.create(
            [
                {
                    account: toAccount,
                    amount: amount,
                    transaction: transaction._id,
                    type: "CREDIT"
                }
            ],
            { session }
        );

        // 8. Mark transaction COMPLETED
        transaction.status = "COMPLETED";
        await transaction.save({ session });

        // 9. Commit MongoDB session
        await session.commitTransaction();
        session.endSession();

        // 10. Send email notification
        if (fromUserAccount.user && toUserAccount.user) {
            emailService.sendTransactionEmail({
                fromUser: fromUserAccount.user,
                toUser: toUserAccount.user,
                fromAccount: fromAccount,
                toAccount: toAccount,
                amount: amount,
                status: "COMPLETED",
                transactionId: transaction._id
            }).catch(err => console.error("Error sending transaction email:", err));
        }

        return res.status(201).json({
            message: "transaction completed successfully",
            transaction
        });

    } catch (error) {
        // Abort the transaction if any of the steps fail
        await session.abortTransaction();
        session.endSession();
        console.error("Transaction processing error:", error);
        return res.status(500).json({
            message: "transaction failed during processing",
            error: error.message
        });
    }
}

module.exports = { createTransaction };
