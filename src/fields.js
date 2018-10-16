const Util = require('./util');

class Fields {
  constructor(opts = {}){
    this.fieldMap = {};
    this.fieldType = ['Number', 'String', 'Boolean', 'Array', 'Object', 'Date', 'Virtual'];
    this.data = opts;
    this._init();
  }

  _init() {
    let that = this;
    function loopData(fields, parentKey) {
      for (let key in fields) {
        let field = fields[key],
          alias = parentKey ? `${parentKey}.${key}` : key;
        if (field == undefined) continue;
        if (typeof field === 'object' && !Array.isArray(field)) {
          if(field instanceof Fields){
            fields[key] = that._defaultValue(loopData(field.data, alias));
          }else{
            if (!this.fieldType.includes(field.type)) {
              loopData(fields[key], alias);
            } else {
              fields[key] = that._defaultValue(field);
              fields[key].alias = alias;
            }
          }
        } else {
          if(Array.isArray(field)){
            if(field[0] instanceof Fields){
              fields[key] = that._defaultValue([loopData(field[0].data, alias)]);
            }
          }else{
            fields[key] = that._defaultValue(field);
            fields[key].alias = alias;
          }
        }
        if (fields[key].alias) that.fieldMap[fields[key].alias] = fields[key];
      }
      return fields;
    }
    loopData(this.data);
  }

  //默认值
  _defaultValue(value) {
    let newValue = {
        type: Array.isArray(value) ? 'Array' : Util.firstUpperCase(typeof value)
      },
      defaultValue = '';
    if (typeof value == 'function') {
      newValue.type = Util.firstUpperCase(value.name.toString());
    } else if (typeof value == 'object' && !Array.isArray(value)) {
      if(Array.isArray(value)){

      }else{
        defaultValue = value.default;
        Object.assign(newValue, value);
      }
    }
    switch (newValue.type) {
      case 'Number':
        newValue.default = defaultValue || 0;
        break;
      case 'String':
        newValue.default = defaultValue || '';
        break;
      case 'Boolean':
        newValue.default = defaultValue || false;
        break;
      case 'Array':
        newValue.default = defaultValue || [];
        break;
      case 'Object':
        newValue.default = defaultValue || {};
        break;
      case 'Date':
        newValue.default = defaultValue || new Date();
        break;
      case 'Virtual':
        newValue.default = defaultValue || '';
        break;
    }
    return newValue;
  }

  _validateError(key, field) {
    let err = null,
      errObj = Util.deepCopy(CONFIG.error_code.error_validation);
    if (typeof field == 'object') {
      let value = field.value !== undefined ? field.value : field.default;
      // 验证是否空值
      if (field.required) {
        let isOk = true;
        if (value == undefined) isOk = false;
        if (typeof value == 'string' && value == '') isOk = false;
        if (typeof value == 'object') {
          if (JSON.stringify(value) == '{}' || JSON.stringify(value) == '[]') isOk = false;
        }
        if (!isOk) {
          err = errObj;
          err.msg += `, [${key}]不能为空`;
          return err;
        }
        // 验证数据类型
        if (field.type && field.type !== 'Virtual') {
          if (field.type == 'Date') {
            if (!(value instanceof Date)) {
              err = errObj;
              err.msg += `, [${key}]数据类型不是${field.type}类型`;
              return err;
            }
          } else if (typeof value !== field.type.toLowerCase()) {
            err = errObj;
            err.msg += `, [${key}]数据类型不是${field.type}类型`;
            return err;
          }
        }
      }
      // 检验最大字符长度
      if(field.maxLength){
        if(JSON.stringify(value).length > field.maxLength){
          err = errObj;
          err.msg += `, [${key}]值长度超过最大允许值${field.maxLength}`;
          return err;
        }
      }
      //自定义验证  param: value
      if (field.validator) {
        if (typeof field.validator == 'function') {
          let hasErr = field.validator(value);
          if (hasErr) {
            err = hasErr.error || errObj;
            return err;
          }
        }
      }
    }
    return err;
  }

  // 验证字段
  validate() {
    let that = this;
    function loopData(fields) {
      let hasErr = false;
      for (let key in fields) {
        let field = fields[key];
        if (!this.fieldType.includes(field.type)) {
          hasErr = loopData(field);
        } else {
          hasErr = that._validateError(key, field);
        }
        if (hasErr) break;
      }
      return hasErr;
    }
    return loopData(this.data);
  }

  // 设置数据
  setData(target, value) {
    let fields = this.data,
      fieldType = this.fieldType,
      that = this;
    if (target !== undefined && value !== undefined) {
      if (typeof target == 'string') {
        if (!fields[target]) return;
        fields[target].value = value;
      } else {
        target.value = value;
      }
    } else if (typeof target == 'object' && !Array.isArray(target) && value == undefined) {
      if (!Util.isEmpty(target)) {
        function loopData(_fields, data) {
          for (let key in _fields) {
            let value = data[key];
            if (value == undefined) continue;
            if (!fieldType.includes(_fields[key].type)) {
              loopData(_fields[key], value);
            } else {
              _fields[key].value = value;
            }
          }
        }
        loopData(fields, target);
      }
    }
  }

  // 获取模型数据
  getData(hasVirtualField = true) {
    let that = this;
    function loopData(fields, parentData) {
      if (!Util.isEmpty(fields)) {
        for (let key in fields) {
          let field = fields[key];
          if (!hasVirtualField && field.type == 'Virtual') continue;
          if (typeof field == 'object' && !Array.isArray(field)) {
            if (!this.fieldType.includes(field.type)) {
              parentData[key] = loopData(field, {});
            } else {
              let theVal = field.value || field.default;
              parentData[key] = theVal;
            }
          } else if (typeof field !== 'function') {
            parentData[key] = field;
          }
        }
      }
      return parentData;
    }
    return loopData(this.data, {});
  }
}

module.exports = Fields;
