/**
 * Created by Administrator on 2017/5/10.
 */
const models = require('../database/db');
const db = models.db;
const Schema = models.Schema;
/**定义了一个新的模型，但是此模式还未和users集合有关联*/
const codeSchema = new Schema({
    user_email: {
        type: String,
        unique: true
    },
    user_code: String,
    user_code_overdue: Number
},{
    versionKey: false
});
/**与数据库users集合关联*/
module.exports = db.model('codes', codeSchema);