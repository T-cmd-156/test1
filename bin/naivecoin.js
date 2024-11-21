#!/usr/bin/env node

const naivecoin = require('./../lib/naivecoin'); // 引入 naivecoin 核心逻辑
const mongoose = require("mongoose");           // 引入 mongoose 连接数据库
const argv = require('yargs')


    .usage('Usage: $0 [options]')
    .alias('a', 'host')
    .describe('a', 'Host address. (localhost by default)')
    .alias('p', 'port')
    .describe('p', 'HTTP port. (3001 by default)')
    .alias('l', 'log-level')
    .describe('l', 'Log level (7=dir, debug, time and trace; 6=log and info; 4=warn; 3=error, assert; 6 by default).')
    .describe('peers', 'Peers list.')
    .describe('name', 'Node name/identifier.')
    .array('peers')
    .help('h')
    .alias('h', 'help')
    .argv;

// MongoDB 连接 URL，数据库名称为 naivecoin
const mongoUri = "mongodb://localhost:27017/naivecoin";

// 连接 MongoDB 并启动 Naivecoin 服务
mongoose
    .connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log("Connected to MongoDB successfully!");

        // 如果 MongoDB 连接成功，启动 Naivecoin 服务
        naivecoin(argv.host, argv.port, argv.peers, argv.logLevel, argv.name);
    })
    .catch((err) => {
        console.error("Failed to connect to MongoDB:", err);
        process.exit(1); // 如果连接失败，退出程序
    });
