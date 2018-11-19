// 工具类
// by YuRonghui 2018-11-18

// 捕获异常
exports.catchErr = function(promise){
  return promise
    .then(data => ({ data }))
    .catch(err => ({ err }));
};

// 唯一码
exports.uuid = function() {
  function S4() {
    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
  }
  return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
};

// 深拷贝
exports.deepCopy = function(obj){
  let newobj = Array.isArray(obj) ? [] : {};
  if(typeof obj !== 'object'){
    return;
  } else {
    for(let i in obj){
      newobj[i] = typeof obj[i] === 'object' && !(obj[i] instanceof Date) ? exports.deepCopy(obj[i]) : obj[i];
    }
  }
  return newobj;
};

// 是否空对象
exports.isEmpty = function(value){
  if(JSON.stringify(value) == '{}' || JSON.stringify(value) == '[]') return true;
  return false;
};

// 首字母小写
exports.firstLowerCase = function(str, otherIsLower = true) {
  return str.replace(/\b(\w)(\w*)/g, function($0, $1, $2) {
    return $1.toLowerCase() + (otherIsLower ? $2.toLowerCase() : $2);
  });
};

// 首字母大写
exports.firstUpperCase = function(str, otherIsLower = true) {
  return str.replace(/\b(\w)(\w*)/g, function($0, $1, $2) {
    return $1.toUpperCase() + (otherIsLower ? $2.toLowerCase() : $2);
  });
};

// 对象key大小写转换
exports.objectKeyLowerUpper = function(obj, isLower, otherIsLower = true){
  if(typeof obj == 'object'){
    if(!Array.isArray(obj)){
      let newObj = {};
      for(let key in obj){
        let newKey = isLower ? exports.firstLowerCase(key, otherIsLower) : exports.firstUpperCase(key, otherIsLower);
        newObj[newKey] = obj[key];
      }
      return newObj;
    }
  }
  return obj;
};

// 过滤html
exports.filterHtml = function(str){
  return str ? str.replace(/<[^>]+>/g,"") : '';
}

// 返回错误
exports.error = function(err) {
  let result = JSON.parse(JSON.stringify(WOOD.error_code.error));
  if (typeof err !== 'object') {
    if(typeof err == 'string') result.msg = err;
    result.error = err;
  }else if(typeof err == 'object'){
    if(err.message){
      result.msg = err.message;
      result.error = err;
    }else if(err.msg && err.code){
      result = err;
    }
  }
  return result;
};
