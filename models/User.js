const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    studentId: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    userType: { type: String, required: true, enum: ["STUDENT", "TEACHER"] },
    email: { type: String, required: true },
});

const User = mongoose.model("User", userSchema);

module.exports = { User };
