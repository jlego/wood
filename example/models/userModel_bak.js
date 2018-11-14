// by YuRonghui 2018-10-19
const { Modelsql, error } = require('../../index');

class UserModel extends Modelsql {
  constructor(data = {}, opts = {}) {
    super(data, {
      database: 'test',
      tableName: 'users',
      fields: {
        //行Id
        "id": {
          type: 'serial',
          primaryKey: true
        },
        "name": {
          type: 'varchar',
          length: 11,
          default: "''"
        },
        "age": {
          type: 'int',
          length: 20,
          default: 0
        },
        "status": {
          type: 'int',
          length: 3,
          default: 0
        }
      },
      ...opts
    });
  }
}

module.exports = UserModel;
