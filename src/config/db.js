const mongoose = require("mongoose")

function connectToDb(){
    mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("server is connected to DB")
    })
    .catch((err) => {
        console.log("error connection to DB")
        process.exit(1)
    })
}

module.exports = connectToDb;
