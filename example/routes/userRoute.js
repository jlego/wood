const { Router, Controller } = require('../../index');
const multipart = require('connect-multiparty');
const controller = Controller('user');

Router.put('/user/list', controller.list.bind(controller));

Router.put('/user/detail', controller.detail.bind(controller));

module.exports = Router;
