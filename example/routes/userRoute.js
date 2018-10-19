const { Router } = require('../../index');
const multipart = require('connect-multiparty');
const UserController = require('../controllers/userController');

Router.put('/user/list', (req, res, next) =>{
  UserController.list(req, res, next);
});

Router.put('/user/detail', (req, res, next) =>{
  UserController.detail(req, res, next);
});

module.exports = Router;
