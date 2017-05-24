/**
 * Created by Administrator on 2017/4/24.
 * 接口工具库
 */
/**引入分页查询工具库*/
const dbHelper = require('./page-query');
/**引入token工具*/
const jwt = require('jsonwebtoken');
/**引入数据模型*/
const user_module = require('../models/user');
const balance_module = require('../models/balance');
const code_module = require('../models/code');
const bill_module = require('../models/bill');
/**引入express包*/
const express = require('express');
/**创建路由*/
const router = express.Router();
/**验证token的中间键*/
const check_api_token = require('./check_api_token');
/**发送邮件的插件*/
const sendMail = require('../lib/mail');

/**创建接口*/
/**用户登录*/
router.post('/thepalestink/login',(req,res) => {
    /**这里的req.body能够使用就在index.js中引入了const bodyParser = require('body-parser')*/
    if(!req.query.user_name) {
        res.json({status: 0, msg: '请输入帐号'});
        return;
    }
    if(!req.query.user_password) {
        res.json({status: 0, msg: '请输入密码'});
        return;
    }
    let user = {
        user_name: req.query.user_name,
        user_password: req.query.user_password
    };
    user_module.find(user, function(err, doc){
        if(doc.length){
            /**创建token*/
            let token = jwt.sign(user, 'app.get(superSecret)', {
                expiresIn: 60*60*24 /**设置过期时间*/
            });
            res.json({
                status: 1,
                msg: '登陆成功',
                data: {
                    token,
                    user: {
                        _id: doc[0]._id,
                        user_name: doc[0].user_name
                    }
                }
            });
        }else{
            res.json({
                status: 0,
                msg: '帐号或密码不正确'
            });
        }
    });
});
/**验证用户信息是否已注册*/
router.get('/thepalestink/checkUserRepeat',(req,res) => {
    let user = JSON.parse(req.query.user_msg);
    user_module.count(user, function(err, doc){
        if(doc){
            res.json({ status: 0 });
        }else{
            res.json({ status: 1 });
        }
    });
});
/**发送邮件*/
router.get('/thepalestink/sendEmail',(req,res) => {
    let user_email = req.query.user_email;
    if(!req.query.user_email) {
        res.json({status: 0, msg: '请输入邮箱'});
        return;
    }
    if(!(/^(\w)+(\.\w+)*@(\w)+((\.\w+)+)$/).test(req.query.user_email)) {
        res.json({status: 0, msg: '邮箱格式不正确'});
        return;
    }
    var random_num = '';
    for(var i=0; i<6; i++) {
        random_num += Math.floor(Math.random()*10);
    }
    sendMail(user_email,'浪笔头注册验证', '您的验证码是：' + random_num,function () {
        /**存储用户验证码*/
        var code = {
            user_email: user_email,
            user_code: random_num,
            user_code_overdue: Date.parse(new Date()) + (60*2*1000)
        };
        code_module.update(code, function(err, doc){
            if(err){
                res.json({status: 0});
            }else {
                res.json({status: 1});
            }
        });
    },function () {
        res.json({ status: 0 });
    });
});
/**用户注册*/
router.post('/thepalestink/register',(req,res) => {
    if(!req.query.user_name) {
        res.json({status: 0, msg: '请输入帐号'});
        return;
    }
    if(!req.query.user_password) {
        res.json({status: 0, msg: '请输入密码'});
        return;
    }
    if(!req.query.user_email) {
        res.json({status: 0, msg: '请输入邮箱'});
        return;
    }
    if(!(/^(\w)+(\.\w+)*@(\w)+((\.\w+)+)$/).test(req.query.user_email)) {
        res.json({status: 0, msg: '邮箱格式不正确'});
        return;
    }
    if( req.query.user_password.length != 6) {
        res.json({status: 0, msg: '请输入6位数的密码'});
        return;
    }
    if(req.query.user_password != req.query.user_too_password) {
        res.json({status: 0, msg: '两次密码不一致'});
        return;
    }
    var code = {
        user_email: req.query.user_email,
        user_code: req.query.user_code
    };
    code_module.find(code, function(err, doc){
        if(doc.length){
            if (Date.parse(new Date()) > doc[0].user_code_overdue){
                res.json({status: 0, msg: '验证码失效，请重新验证'});
                return;
            }
            let user = {
                user_name: req.query.user_name,
                user_email: req.query.user_email,
                user_password: req.query.user_password,
                user_register_date: new Date()
            };
            user_module.create(user, function(err, doc){
                if(err){
                    res.json({status: 0, msg: '注册失败'});
                }else {
                    res.json({status: 1, msg: '注册成功'});
                }
            });
        }else{
            res.json({status: 0, msg: '验证码错误'});
            return;
        }
    });

});
/**用户修改密码*/
router.get('/thepalestink/modifyPassword',(req,res) => {
    var query = req.query,
        user_name = query.user_name,
        old_password = query.old_password,
        password_value = query.password_value,
        too_password_value = query.too_password_value;
    if (!user_name) {
        res.json({ status: -1 });
        return;
    }
    if (!old_password) {
        res.json({ status: 0,msg: '请输入旧密码'});
        return;
    }
    if (!password_value) {
        res.json({ status: 0,msg: '请输入新密码'});
        return;
    }
    if (too_password_value != password_value) {
        res.json({ status: 0,msg: '两次密码不一致'});
        return;
    }
    user_module.find({
        user_name: user_name
    }, (err, doc) => {
        if(doc.length){
            var password = doc[0].user_password;
            if(password == old_password) {
                user_module.update({
                    user_name: user_name,
                    user_password: password_value
                },(e,d) => {
                    if (!e){
                        res.json({ status: 1,msg: '修改成功，请重新登录'});
                    } else {
                        res.json({ status: 0,msg: '修改失败'});
                    }
                });
            }else{
                res.json({ status: 0,msg: '旧密码错误'});
            }

        }else{
            res.json({ status: -1 });
        }
    });
});
/**用户找回密码*/
router.get('/thepalestink/retrievePassword',(req,res) => {
    var query = req.query,
        user_email = query.email_value;
    if (!user_email) {
        res.json({status: 0, msg: '请输入邮箱'});
        return;
    }
    user_module.find({
        user_email: user_email
    }, (err, doc) => {
        if(doc.length){
            var password = doc[0].user_password;
            var name = doc[0].user_name;
            sendMail(user_email,'浪笔头找回密码', '您的用户名是：'+ name +'您的密码是：' + password,function () {
                res.json({status: 1,msg:'找回密码成功，请登录邮箱查看'});
            },function () {
                res.json({ status: 0, msg: '找回密码失败'});
            });
        }else{
            res.json({ status: 0, msg: '该邮箱还未注册'});
        }
    });
});
/**查询用户总金额*/
router.get('/thepalestink/fetchTotalBalance',check_api_token,(req,res) => {
    /**查询*/
    balance_module.find({
        user_name: req.query.user_name
    },(err,doc) =>{
        if (doc.length){
            res.json({
                status: 1,
                msg: '获取余额成功',
                data: {
                    balance: doc[0].user_balance
                }
            });
        } else if(!err) {
            /**用户还没有存入*/
            res.json({
                status: 1,
                msg: '获取余额成功',
                data: {
                    balance: 0
                }
            });
        } else {
            /**获取信息异常*/
            res.json({
                status: 2,
                msg: '获取信息异常'
            });
        }
    });
});

/**生成账单*/
router.get('/thepalestink/addBill',check_api_token,(req,res) => {
    var query = req.query;
    let bill = {
        bill_id: Date.parse(new Date()),
        bill_sum: query.sum_value,
        bill_date: query.date_value,
        bill_time: query.time_value,
        bill_remarks: query.remarks_value,
        bill_account_type: query.account_type,
        bill_type_number: query.type_number,
        bill_consumption_or_earn: query.consumption_or_earn
    };
    bill_module.find({
        user_name: query.user_name
    }, function(err, doc){
        if(doc.length){
            doc[0].bills.push(bill);
            bill_module.update({
                user_name:query.user_name,
                bills: doc[0].bills
            }, (e,d) => {
                if (e){
                    res.json({
                        status: 0,
                        msg: '账单录入失败'
                    });
                } else {
                    res.json({
                        status: 1,
                        msg: '账单录入成功'
                    });
                    countBalance(query.user_name,bill)
                }
            });
        }else if(!err){
            /**用户还没有账单信息*/
            bill_module.create({
                user_name:query.user_name,
                bills: [bill]
            }, (err,doc) => {
                if (err){
                    res.json({
                        status: 0,
                        msg: '账单录入失败'
                    });
                } else {
                    res.json({
                        status: 1,
                        msg: '账单录入成功'
                    });
                    countBalance(query.user_name,bill)
                }
            });
        }else {
            /**获取信息异常*/
            res.json({
                status: 2,
                msg: '获取信息异常'
            });
        }
    });
});
/**计算用户余额*/
function countBalance (user_name,bill) {
    /**查询*/
    balance_module.find({
        user_name: user_name
    },(err,doc) =>{
        if (doc.length){
            var user_balance = doc[0].user_balance;
            if (bill.bill_consumption_or_earn == 1) {
                user_balance = user_balance + (+bill.bill_sum);
            } else {
                user_balance = user_balance - (+bill.bill_sum);
            }
            balance_module.update({
                user_name: user_name,
                user_balance: user_balance
            },(err,doc) =>{
                if( err ) return false;
                else return true;
            });
        } else if(!err) {
            var user_balance = 0;
            if (bill.bill_consumption_or_earn == 1) {
                user_balance = user_balance + (+bill.bill_sum);
            } else {
                user_balance = user_balance - (+bill.bill_sum);
            }
            balance_module.create({
                user_name: user_name,
                user_balance: user_balance
            },(err,doc) =>{
                if( err ) return false;
                else return true;
            });
        }
    });
}

/**获取账单*/
router.get('/thepalestink/fetchBill',check_api_token,(req,res) => {
    var user_name = req.query.user_name;
    var query_condition = req.query.query_condition && JSON.parse(req.query.query_condition);
    bill_module.find({
        user_name: user_name
    },(err,doc) => {
        if(doc.length){
            var bill_arr = doc[0].bills;
            if( query_condition ){
                var year_value = query_condition.year_value;
                var month_value = query_condition.month_value;
                var day_value = query_condition.day_value;
                var check_value_arr = query_condition.check_value_arr;
                if(year_value){
                    var arr = [];
                    bill_arr.forEach((item,index) => {
                        if(item.bill_date.split('-')[0] == year_value){
                            arr.push(item);
                        }
                    });
                    bill_arr = arr;
                }
                if(month_value){
                    var arr = [];
                    bill_arr.forEach((item,index) => {
                        if(item.bill_date.split('-')[1] == month_value){
                            arr.push(item);
                        }
                    });
                    bill_arr = arr;
                }
                if(day_value){
                    var arr = [];
                    bill_arr.forEach((item,index) => {
                        if(item.bill_date.split('-')[2] == day_value){
                            arr.push(item);
                        }
                    });
                    bill_arr = arr;
                }
                if(check_value_arr.length){
                    var arr = [];
                    check_value_arr.forEach((item,index) => {
                        bill_arr.forEach((it,i) => {
                            if(it.bill_type_number == item){
                                arr.push(it);
                            }
                        });
                    });
                    bill_arr = arr;
                }
            }
            res.json({
                status: 1,
                msg: '获取账单成功',
                data: {
                    bills: bill_arr
                }
            });
        } else if(!err) {
            res.json({
                status: 1,
                msg: '获取账单成功',
                data: {
                    bills: []
                }
            });
        } else {
            res.json({
                status: 2,
                msg: '获取数据异常'
            });
        }
    });
});

/**删除账单*/
router.get('/thepalestink/removeBill',check_api_token,(req,res) => {
    var user_name = req.query.user_name,
        bill = JSON.parse(req.query.bill);
    bill_module.find({
        user_name: user_name
    },(err,doc) => {
        if(doc.length){
            var bill_arr = doc[0].bills;
            bill_arr.forEach( (item,index) => {
                if( item.bill_id == bill.bill_id ) {
                    bill_arr.splice(index, 1);
                    return;
                }
            });
            bill_module.update({
                user_name: user_name,
                bills: bill_arr
            },(err,doc) => {
                if(!err) {
                    balance_module.find({
                        user_name: user_name
                    },(err,doc) => {
                        if(doc.length){
                            var user_balance = doc[0].user_balance;
                            if ( bill.bill_consumption_or_earn == 0 ){
                                /**消费账单*/
                                user_balance = user_balance + (+bill.bill_sum)
                            } else {
                                /**入账账单*/
                                user_balance = user_balance - (+bill.bill_sum)
                            }
                            balance_module.update({
                                user_name: user_name,
                                user_balance: user_balance
                            },(err,doc) => {
                                if(err){
                                    res.json({
                                        status: 0,
                                        msg: '账单更新失败'
                                    });
                                }else{
                                    res.json({
                                        status: 1,
                                        msg: '删除账单成功'
                                    });
                                }
                            });
                        }else{
                            res.json({
                                status: 0,
                                msg: '数据异常，账单更新失败'
                            });
                        }
                    });
                } else {
                    res.json({
                        status: 0,
                        msg: '账单更新失败'
                    });
                }
            })
        } else {
            res.json({
                status: 0,
                msg: '数据异常，账单更新失败'
            });
        }
    });
});

module.exports = router;