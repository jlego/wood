// by YuRonghui 2018-10-19
const {Model, Fields, error} = require('../../index');

module.exports = Model('master.users', new Fields({
    "uid": {
      type: 'Number',
      required: true,
      index: true
    },
    //注册名(唯一)
    "username": {
      type: 'String',
      required: true,
      index: true
    },
    //密码
    "password": {
      type: 'String',
      required: true,
    },
    //昵称
    "nickname": {
      type: 'String',
    },
    //头像
    "avatar": {
      type: 'String',
    },
    //真实姓名
    "realname": {
      type: 'String',
    },
    //性别
    "sex": {
      type: 'String',
    },
    //年龄
    "age": {
      type: 'Number',
    },
    //职业
    "profession": {
      type: 'String',
    },
    // 爱好
    "hobby": {
      type: 'String',
    },
    // 学历
    "education": {
      type: 'String',
    },
    // 收入
    "salary": {
      type: 'String',
    },
    // 地址
    "address": {
      type: 'String',
    },
    // 绑定手机
    "telephone": {
      type: 'String',
    },
    // 注册来源,指第三方平台
    "registerSrc": {
      type: 'String',
    },
    // 注册时间
    "registerTime": {
      type: 'Date',
    },
    // 基础标签
    "basicLabel": {
      type: 'String',
    },
    // 社会标签
    "socialLabel": {
      type: 'String',
    },
    // 消费标签
    "consumeLabel": {
      type: 'String',
    },
    // 游戏标签
    "gameLabel": {
      type: 'String',
    },
    // 行为标签
    "behaviourLabel": {
      type: 'String',
    },
    // 自定义标签
    "customLabel": {
      type: 'String',
    },
    // 账户状态
    "status": {
      type: 'String'
    },
    // 最后一次登陆时间
    "lastLoginTime": {
      type: 'Date'
    },
    // 关联的第三方账户
    "platformId": {
      type: 'String'
    },
  }),
  {},  //select
  'rowid' //primarykey
);
