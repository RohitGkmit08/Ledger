const mongoose = require("mongoose")
const ledgerModel  = require("../models/ledger.model");

const accountSchema = new mongoose.Schema({
    user : {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: [true, "account must be associated with some user"],
        index: true
    },
    status: {
        type: String,
        enum: {
            values: ["Active", "Frozen", "Closed"],
            message: "Status can be either Active, Frozen or Closed"
        },
        default: "Active"
    },
    currency: {
        type: String,
        required: [true, "Currency is required for creating an account"],
        default: "INR"
    },
    
},{
    timestamps: true
})

accountSchema.index({user: 1, status: 1})

accountSchema.methods.getBalance =  async function (session = null){
    const balanceData = await ledgerModel.aggregate([
        {$match: {account : this._id}},
        {
            $group: {
                _id: null,
                totalCredit: {
                    $sum: {
                        $cond: [{ $eq: ["$type", "CREDIT"] }, "$amount", 0]
                    }
                },
                totalDebit: {
                    $sum: {
                        $cond: [{ $eq: ["$type", "DEBIT"] }, "$amount", 0]
                    }
                }
            }
        }
    ]).session(session);

    if (balanceData.length === 0) {
        return 0;
    }
    return balanceData[0].totalCredit - balanceData[0].totalDebit;
}


const accountModel = mongoose.model("account", accountSchema);
module.exports = accountModel