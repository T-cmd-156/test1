const express = require("express");
const bcrypt = require("bcrypt");
const { User } = require("../models/User");
const router = express.Router();

// 注册路由
router.post("/register", async (req, res) => {
    try {
        const { studentId, password, userType, email } = req.body;

        // 检查必填字段
        if (!studentId || !password || !userType || !email) {
            return res.status(400).json({ error: "All fields are required" });
        }

        // 检查用户类型是否合法
        if (!["STUDENT", "TEACHER"].includes(userType)) {
            return res.status(400).json({ error: "Invalid user type" });
        }

        // 检查邮箱格式
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: "Invalid email address" });
        }

        // 检查学生 ID 是否已注册
        const existingUser = await User.findOne({ studentId });
        if (existingUser) {
            return res.status(400).json({ error: "Student ID already registered" });
        }

        // 加密密码
        const hashedPassword = await bcrypt.hash(password, 10);

        // 创建新用户
        const newUser = new User({
            studentId,
            password: hashedPassword,
            userType,
            email,
        });

        // 保存用户
        await newUser.save();

        res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
});

module.exports = router;
