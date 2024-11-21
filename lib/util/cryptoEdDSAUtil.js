const crypto = require('crypto');
const elliptic = require('elliptic');
const EdDSA = elliptic.eddsa;
const ec = new EdDSA('ed25519');
const SALT = '0ffaa74d206930aaece253f090c88dbe6685b9e66ec49ad988d84fd7dff230d1';  // 盐值，确保每次生成的密钥都不同

class CryptoEdDSAUtil {
    /**
     * 从密码生成秘密密钥
     * @param {String} password 密码
     * @returns {String} 返回生成的私钥（16进制）
     */
    static generateSecret(password) {
        let secret = crypto.pbkdf2Sync(password, SALT, 10000, 512, 'sha512').toString('hex');
        console.debug(`Secret: \n${secret}`);
        return secret;  // 返回私钥
    }

    /**
     * 根据秘密密钥生成公私钥对
     * @param {String} secret 生成的私钥（16进制）
     * @returns {Object} 返回公私钥对对象
     */
    static generateKeyPairFromSecret(secret) {
        // 使用给定的私钥生成公私钥对
        let keyPair = ec.keyFromSecret(secret); // 使用私钥生成公私钥对
        console.debug(`Public key: \n${elliptic.utils.toHex(keyPair.getPublic())}`);
        return keyPair;  // 返回公私钥对
    }

    /**
     * 对消息的哈希进行签名
     * @param {Object} keyPair 公私钥对
     * @param {String} messageHash 消息的哈希值
     * @returns {String} 返回签名（16进制）
     */
    static signHash(keyPair, messageHash) {
        let signature = keyPair.sign(messageHash).toHex().toLowerCase();
        console.debug(`Signature: \n${signature}`);
        return signature;  // 返回签名
    }

    /**
     * 验证签名
     * @param {String} publicKey 公钥（16进制）
     * @param {String} signature 签名（16进制）
     * @param {String} messageHash 消息的哈希值
     * @returns {Boolean} 返回签名验证结果，`true` 为合法，`false` 为非法
     */
    static verifySignature(publicKey, signature, messageHash) {
        let key = ec.keyFromPublic(publicKey, 'hex');
        let verified = key.verify(messageHash, signature);
        console.debug(`Verified: ${verified}`);
        return verified;  // 返回验证结果
    }

    /**
     * 将数据转换为16进制格式
     * @param {Buffer|String} data 数据
     * @returns {String} 16进制格式的字符串
     */
    static toHex(data) {
        return elliptic.utils.toHex(data);  // 转换为16进制格式
    }
}

module.exports = CryptoEdDSAUtil;  // 导出模块
