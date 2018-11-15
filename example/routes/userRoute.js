const { Router, Controller } = require('../../index');
const multipart = require('connect-multiparty');

Router('user').put('/user/list', Controller('user').list);

Router('user').put('/user/detail', Controller('user').detail);
// 添加用户
Router('user').put('/user/add', Controller('user').add);

module.exports = Router;
