/**
 * Created by Administrator on 2017/5/10.
 */
const models = require('../database/db');
const db = models.db;
const Schema = models.Schema;
/**定义模型*/
const billSchema = new Schema({
    user_name: {
        type: String,
        unique: true
    },
    bills: Array
},{
    versionKey: false
});
module.exports = db.model('bills', billSchema);