const express = require("express");
const bcrypt = require("bcrypt");
const { User } = require("../models/User");
const jwt = require("jsonwebtoken");
const router = express.Router();
// 登录路由
router.post("/login", async (req, res) => {
    try {
        const { studentId, password } = req.body;

        // 检查必填字段
        if (!studentId || !password) {
            return res.status(400).json({ error: "Student ID and password are required" });
        }

        // 查找用户
        const user = await User.findOne({ studentId });
        if (!user) {
            return res.status(400).json({ error: "Invalid Student ID or password" });
        }

        // 验证密码
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ error: "Invalid Student ID or password" });
        }

        // 生成 JWT（可选，视需求而定）
        const token = jwt.sign(
            { studentId: user.studentId, userType: user.userType },
            "your_secret_key", // 使用一个安全的密钥
            { expiresIn: "1h" }
        );

        res.status(200).json({
            message: "Login successful",
            token, // 返回生成的 JWT
            userType: user.userType,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
});

module.exports = router;
