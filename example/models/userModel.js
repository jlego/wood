// by YuRonghui 2018-10-19
const {Model, Fields, error} = require('../../index');

let UserModel = Model('master.users', new Fields({}));

module.exports = UserModel;
