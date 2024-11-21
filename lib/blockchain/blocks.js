const Block = require('./block');  // 引入 Block 类，用于处理单个区块
const R = require('ramda');  // 引入 Ramda 库，用于简化数组和对象操作

class Blocks extends Array {
    // 静态方法：从 JSON 数据创建多个区块
    static fromJson(data) {
        // 检查输入数据是否为有效的数组
        if (!Array.isArray(data)) {
            throw new Error("Invalid data format: Expected an array of blocks.");
        }

        let blocks = new Blocks();

        // 使用 Ramda 的 forEach 遍历数据，逐个转换每个区块
        R.forEach((block) => {
            if (block && block.index && block.hash) {
                try {
                    // 每个有效的区块通过 Block.fromJson 转换为 Block 实例
                    blocks.push(Block.fromJson(block));
                } catch (e) {
                    console.warn("Failed to parse block:", e);
                }
            } else {
                console.warn("Skipping invalid block data:", block);
            }
        }, data);

        return blocks;
    }

    // 获取区块链中区块的总数
    getTotalBlocks() {
        return this.length;  // 返回区块数组的长度
    }

    // 根据区块索引查找区块
    findBlockByIndex(index) {
        return this.find(block => block.index === index);  // 使用 Array 的 find 方法查找指定 index 的区块
    }

    // 获取最新的区块（index 最大的区块）
    getLatestBlock() {
        return this.reduce((latest, block) => (block.index > latest.index ? block : latest), this[0]);
    }
}

module.exports = Blocks;  // 导出 Blocks 类，供其他模块使用
