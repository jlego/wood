const { Router, Controller } = require('../../index');
const multipart = require('connect-multiparty');
const controller = Controller('user');

Router.put('/user/list', controller.list.bind(controller));

Router.put('/user/detail', controller.detail.bind(controller));
// 添加用户
Router.put('/user/add', controller.add.bind(controller));

module.exports = Router;
