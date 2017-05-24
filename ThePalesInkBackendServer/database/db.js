/**
 * Created by Administrator on 2017/4/24.
 * 链接数据库的db工具库
 */

/**引入包mongoose*/
const mongoose = require('mongoose');

/**连接数据库*/
const db = mongoose.connect('mongodb://localhost/thepalestink');

/**创建模型*/
const Schema = mongoose.Schema;

/**暴露出接口*/
module.exports = {
    Schema: Schema,
    db: db
};