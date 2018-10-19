const {
  Controller,
  error,
  catchErr,
  Token,
  Util
} = require('../../index');
const UserModel = require('../models/userModel');

class UserController extends Controller {
  constructor(opts = {}) {
    super({
      model: UserModel,
      ...opts
    });
  }
}

module.exports = new UserController();
