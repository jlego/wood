const {
  Controller,
  error,
  catchErr,
  Token,
  Util
} = require('../../index');
const controller = Controller();

class UserController extends controller {
  constructor() {
    super({
      defaultModel: 'users'
    });
  }
}

module.exports = UserController;
