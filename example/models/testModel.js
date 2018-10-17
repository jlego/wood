// by YuRonghui 2018-9-11
const { Model, Fields, error } = require('../../index');

class TestModel extends Model {
  constructor(data = {}, opts = {}) {
    const creator = new Fields({
      "key": String,
      "value": String
    });

    const subdata = new Fields({
      "key": {
        type: 'String',
        required: true
      },
      "value": {
        type: 'String',
        validator(val){
          console.warn('======', val);
          // return '字段不正确';
          return false;
        }
      }
    });

    const fields = new Fields({
      "rowid": {
        type: 'Number',
        required: true,
        index: true
      },
      "title": String,
      "options": Array,
      "creator": creator,
      "subdata": [ subdata ],
      "createTime": Date,
      "updateTime": Date,
      "status": {
        type: 'Number',
        value: 1
      }
    });
    super(data, {
      tableName: 'tests',
      select: {
        "_id": 0,
      },
      fields: fields,
      ...opts
    });
  }
  myFun(){

    this.save();
  }
}

module.exports = TestModel;
