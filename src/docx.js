const JSZip = require('jszip');
const fs = require('fs');
const path = require('path');
const Util = require('./util');
const Docxtemplater = require('docxtemplater');
const ImageModule = require('docxtemplater-image-module');
const imageSize = require("image-size");
const moment = require('moment');
const config = require('./config');

class Docx {
  constructor(opts = {}) {
    this.options = {
      data: {
        modulename: '',
        project: {},
        apis: {}
      },
      template: '', //模板文件路径
      output: '', //保存文件路径
      options: null,
      ...opts
    };
    this.doc = new Docxtemplater();
    this.makeData();
  }
  // 组合数据
  makeData() {
    let data = this.options.data;
    // 项目
    if (typeof data.project == 'string') {
      data.project = JSON.parse(fs.readFileSync(path.join(__dirname, data.project)));
      data.projectName = data.project.name;
      data.version = data.project.version;
      data.description = Util.filterHtml(data.project.description);
      data.title = data.project.title;
      this.options.output = this.options.output.replace('###', data.version);
    }
    // 接口
    if (typeof data.apis == 'string') {
      data.apis = JSON.parse(fs.readFileSync(path.join(__dirname, data.apis)));
      let arr = data.project.url.split(':'),
        port = arr[arr.length - 1];
      data.apis.forEach(item => {
        item.url = item.url.indexOf('http') > -1 ? item.url : `${data.project.url}${item.url}`;
        item.permissionName = item.permission[0].name;
        item.description = Util.filterHtml(item.description);
        item.header = item.header ? item.header.fields['Header'] : [];
        item.hasheader = !!item.header.length;
        item.request = item.parameter ? item.parameter.fields['Parameter'] : [];
        item.hasreq = !!item.request.length;
        item.examples = item.parameter ? (item.parameter.examples ? item.parameter.examples : []) : [];
        item.hasexample = item.parameter ? !!item.parameter.examples : false;
        item.response = item.success ? item.success.fields['Success 200'] : [];
        item.hasresp = !!item.response.length;
        if (item.examples.length) {
          item.examples.forEach(subItem => {
            subItem.content = subItem.content.replace(/  /g, '　');
            let contentLines = subItem.content.split("\n"),
              pre = "<w:p><w:r><w:t>",
              post = "</w:t></w:r></w:p>",
              lineBreak = "<w:br/>";
            subItem.content = pre + contentLines.join(lineBreak) + post;
          });
          item.example = item.examples[0].content;
        }
        item.header.forEach(subItem => {
          subItem.description = Util.filterHtml(subItem.description);
        });
        item.request.forEach(subItem => {
          subItem.description = Util.filterHtml(subItem.description);
        });
        item.response.forEach(subItem => {
          subItem.description = Util.filterHtml(subItem.description);
        });
      });
    }
  }
  // 生成文档
  generate() {
    if (!this.options.template || !this.options.output) return false;
    let content = fs.readFileSync(path.join(__dirname, this.options.template), 'binary');
    let zip = new JSZip(content);
    this.doc.loadZip(zip);
    this.doc.setData(this.options.data);
    if (this.options.options) this.doc.setOptions(this.options.options);
    //图片
    let opts = {};
    opts.centered = false;
    opts.getImage = function(tagValue, tagName) {
      return fs.readFileSync(tagValue);
    };
    opts.getSize = function(img, tagValue, tagName) {
      let imgSize = imageSize(tagValue);
      return [imgSize.width, imgSize.height];
    };
    let imageModule = new ImageModule(opts);
    this.doc.attachModule(imageModule);
    try {
      this.doc.render();
    } catch (error) {
      throw error;
    }
    let buf = this.doc.getZip().generate({
      type: 'nodebuffer'
    });
    fs.writeFileSync(path.join(__dirname, this.options.output), buf);
    return buf;
  }
}

module.exports = {
  path: '/builddocs',
  fun: function(req, res, next) {
    let docx = new Docx({
      data: {
        modulename: config.projectName,
        apis: `../../../docs/api_data.json`,
        project: `../../../docs/api_project.json`
      },
      template: '../template/doctpl/doc.docx',
      output: `../../../docs/${config.projectName}_###.docx`
    });
    let result = docx.generate();
    if (result) {
      res.send(`api文档生成成功 ${moment().format('YYYY-MM-DD HH:mm:ss')}`);
    } else {
      res.send(`api文档生成失败`);
    }
  }
};
