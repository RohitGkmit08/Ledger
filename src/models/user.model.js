const mongoose = require("mongoose")
const bcrypt = require("bcrypt")

const userSchema = new mongoose.Schema({

   email : { type: String,
    required: [true, "Email is required for creating a user"],
    trim: true,
    lowercase: true,
    match: [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, "invalid email format"],
    unique: [true, "Email already exists"]
    },

    name: {
        type: String,
        required:[true,"name is required for creating account"]
    },

    password : {
        type: String,
        required: [true, "password is required for creating account"],
        minLength : [6, "password must be at least of 6 characters"],
        select: false
    }
}, {
    timestamps: true
})

userSchema.pre("save", async function () {

    if(!this.isModified("password")){
        return;
    }

    const hash = await bcrypt.hash(this.password, 5);
    this.password = hash;

})

userSchema.methods.comparePassword = async function(password){
    return await bcrypt.compare(password, this.password)
}

const userModel = mongoose.model("user", userSchema)
module.exports = userModel;