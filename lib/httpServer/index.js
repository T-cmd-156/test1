const express = require('express');
const bodyParser = require('body-parser');
const swaggerUi = require('swagger-ui-express');
const path = require('path');
const swaggerDocument = require('./swagger.json');
const Block = require('../blockchain/block');
const Transaction = require('../blockchain/transaction');
const TransactionAssertionError = require('../blockchain/transactionAssertionError');
const BlockAssertionError = require('../blockchain/blockAssertionError');
const HTTPError = require('./httpError');
const ArgumentError = require('../util/argumentError');
const CryptoUtil = require('../util/cryptoUtil');
const CryptoEdDSAUtil = require('../util/cryptoEdDSAUtil');  // 引入签名验证工具
const timeago = require('timeago.js');

class HttpServer {
    constructor(node, blockchain, operator, miner) {
        this.app = express();

        // 中间件
        this.app.use(bodyParser.json());

        // 添加注册和登录路由
        this.app.use('/api', registerRoute);
        this.app.use('/api', loginRoute);
        
        const projectWallet = (wallet) => {
            return {
                id: wallet.id,
                addresses: wallet.keyPairs.map(keyPair => keyPair.publicKey)
            };
        };

        this.app.use(bodyParser.json());

        this.app.set('view engine', 'pug');
        this.app.set('views', path.join(__dirname, 'views'));
        this.app.locals.formatters = {
            time: (rawTime) => {
                const timeInMS = new Date(rawTime * 1000);
                return `${timeInMS.toLocaleString()} - ${timeago().format(timeInMS)}`;
            },
            hash: (hashString) => {
                return hashString !== '0' ? `${hashString.substr(0, 5)}...${hashString.substr(hashString.length - 5, 5)}` : '<empty>';
            },
            amount: (amount) => amount.toLocaleString()
        };

        // API 文档
        this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

        // 获取区块链所有区块
        this.app.get('/blockchain', (req, res) => {
            if (req.headers['accept'] && req.headers['accept'].includes('text/html')) {
                res.render('blockchain/index.pug', {
                    pageTitle: 'Blockchain',
                    blocks: blockchain.getAllBlocks()
                });
            } else {
                throw new HTTPError(400, 'Accept content not supported');
            }
        });

        // 提交考勤交易
        this.app.post('/blockchain/transactions', (req, res) => {
            let requestTransaction = Transaction.fromJson(req.body);

            // 验证交易的签名
            const isValidSignature = CryptoEdDSAUtil.verifySignature(
                requestTransaction.data.outputs[0].address,  // 假设输出地址是学生地址
                requestTransaction.signature,  // 签名
                requestTransaction.toHash()    // 交易的哈希值
            );

            if (!isValidSignature) {
                return res.status(400).json({ error: 'Invalid transaction signature' });
            }

            let transactionFound = blockchain.getTransactionById(requestTransaction.id);

            if (transactionFound != null) throw new HTTPError(409, `Transaction '${requestTransaction.id}' already exists`);

            try {
                let newTransaction = blockchain.addTransaction(requestTransaction);
                res.status(201).send(newTransaction);
            } catch (ex) {
                if (ex instanceof TransactionAssertionError) throw new HTTPError(400, ex.message, requestTransaction, ex);
                else throw ex;
            }
        });

        // 获取所有未确认交易
        this.app.get('/blockchain/transactions', (req, res) => {
            if (req.headers['accept'] && req.headers['accept'].includes('text/html')) {
                res.render('blockchain/transactions/index.pug', {
                    pageTitle: 'Unconfirmed Transactions',
                    transactions: blockchain.getAllTransactions()
                });
            } else {
                res.status(200).send(blockchain.getAllTransactions());
            }
        });

        // 挖矿
        this.app.post('/miner/mine', (req, res, next) => {
            miner.mine(req.body.rewardAddress, req.body['feeAddress'] || req.body.rewardAddress)
                .then((newBlock) => {
                    newBlock = Block.fromJson(newBlock);
                    blockchain.addBlock(newBlock);
                    res.status(201).send(newBlock);
                })
                .catch((ex) => {
                    if (ex instanceof BlockAssertionError && ex.message.includes('Invalid index')) next(new HTTPError(409, 'A new block was added before we were able to mine one'), null, ex);
                    else next(ex);
                });
        });

        // 错误处理中间件
        this.app.use(function (err, req, res, next) {  // eslint-disable-line no-unused-vars
            if (err instanceof HTTPError) res.status(err.status);
            else res.status(500);
            res.send(err.message + (err.cause ? ' - ' + err.cause.message : ''));
        });
    }

    listen(host, port) {
        return new Promise((resolve, reject) => {
            this.server = this.app.listen(port, host, (err) => {
                if (err) reject(err);
                console.info(`Listening http on port: ${this.server.address().port}, to access the API documentation go to http://${host}:${this.server.address().port}/api-docs/`);
                resolve(this);
            });
        });
    }

    stop() {
        return new Promise((resolve, reject) => {
            this.server.close((err) => {
                if (err) reject(err);
                console.info('Closing http');
                resolve(this);
            });
        });
    }
}

module.exports = HttpServer;
