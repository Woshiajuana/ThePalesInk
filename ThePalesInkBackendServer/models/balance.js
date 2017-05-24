/**
 * Created by Administrator on 2017/5/10.
 */
const models = require('../database/db');
const db = models.db;
const Schema = models.Schema;
/**定义模型*/
const balanceSchema = new Schema({
    user_name: {
        type: String,
        unique: true
    },
    user_balance: Number
},{
    versionKey: false
});
module.exports = db.model('balances', balanceSchema);