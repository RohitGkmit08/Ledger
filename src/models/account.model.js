const mongoose = require("mongoose")

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
const accountModel = mongoose.model("account", accountSchema);
module.exports = accountModel