// by YuRonghui 2018-9-11
const { Model, Fields, error } = require('../../index');

class TestModel extends Model {
  constructor(data = {}, opts = {}) {
    super(data, {
      tableName: 'options',
      select: {
        "_id": 0,
      },
      fields: new Fields({
        "rowid": {
          type: 'Number',
          required: true,
          index: true
        },
        "title": String,
        "options": Array,
        "creator": Object,
        "subdata": [new Fields({
          "key": String,
          "value": String
        })],
        "createTime": Date,
        "updateTime": Date,
        "status": {
          type: 'Number',
          value: 1
        }
      }),
      ...opts
    });
  }
  aaa(){
    this.save();
  }
}

module.exports = TestModel;
