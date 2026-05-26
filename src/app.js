const express = require("express");
const cookieParser = require("cookie-parser");

const app = express()

app.use(express.json())
app.use(cookieParser())

const authRouter = require("./routes/auth.routes");
const accountRouter = require("./routes/account.routes");

app.use("/api/auth", authRouter);
app.use("/api/account", accountRouter)

module.exports = app;