// by YuRonghui 2018-9-11
const {
  Model,
  Fields,
  error
} = require('../../index');

module.exports = Model('master.tests', new Fields({
    "rowid": {
      type: 'Number',
      required: true,
      index: true
    },
    "title": String,
    "options": Array,
    "creator": new Fields({
      "uid": String,
      "name": String
    }),
    "subData": [
      new Fields({
        "key": {
          type: 'String',
          required: true
        },
        "value": {
          type: 'String',
          validator(val) {
            console.warn('======', val);
            // return '字段不正确';
            return false;
          }
        }
      })
    ],
    "createTime": Date,
    "updateTime": Date,
    "status": {
      type: 'Number',
      value: 1
    }
  }),
);
