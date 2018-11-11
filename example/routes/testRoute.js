/**
 * @apiDefine Common
 * @apiParam {Object/Array} data         请求data.
 * @apiSuccess {String} cmd           请求cmd.
 * @apiSuccess {String} msg           结果提示信息.
 * @apiSuccess {Number} status        结果状态码. 成功为 0
 * @apiSuccess {Object} data          结果数据
 * @apiHeader {String} secretkey='aaa'  强制绕过用户登录验证时使用, 一般为服务器局域网内使用
 */
/**
 * @apiDefine Paging
 * @apiParam {Array} data.order       排序 ['id desc']
 * @apiParam {Number} data.limit   每页记录数
 * @apiParam {Number} data.page       当前页码
 */
const { Router, Controller } = require('../../index');
const multipart = require('connect-multiparty');
const controller = Controller('test');

/**
 * @api {put} /test/list 测试列表
 * @apiVersion 0.1.0
 * @apiName test list
 * @apiGroup test
 * @apiPermission admin
 * @apiDescription 列表
 * @apiUse Common
 * @apiUse Paging
 * @apiParam {String} cmd="test_list"       请求cmd.
 * @apiParamExample {json}      请求参数例子:
 *     {
 *       "cmd": "test_list",
 *       "data": {
 *          "limit": 10,
 *          "page": 1,
 *          "order": ['id desc']
 *        }
 *     }
 */
Router.put('/test/list', controller.list.bind(controller));

Router.put('/test/detail', controller.detail.bind(controller));

/**
 * @api {put} /test/create 新增测试配置
 * @apiVersion 0.1.0
 * @apiName test create
 * @apiGroup test
 * @apiPermission admin
 * @apiDescription 新增测试配置
 * @apiUse Common
 * @apiParam {String} cmd="test_create"       请求cmd.
 * @apiParam {Number} data.mid       机器id(必填且不能重复)
 * @apiParam {Number} data.order_type       支付类型(必填且不能重复)
 * @apiParam {Number} data.platform_type       支付渠道(必填且不能重复)
 * @apiParam {String} data.mch_id       商户id
 * @apiParam {String} data.mch_key       商户密钥
 * @apiParam {String} data.share_rate       公司分成比例
 * @apiParamExample {json}      请求参数例子:
 *     {
 *       "cmd": "test_create",
 *       "data": [{
 *          "mid": 81273,
 *          "order_type": 4,
 *          "platform_type": 5,
 *          "mch_id": "188560000125",
 *          "mch_key": "3f41b7df1c79f6c94c195d8ca97d2225",
 *          "share_rate": 100
 *        }]
 *     }
 */
Router.put('/test/create', controller.create.bind(controller));

Router.put('/test/remove', controller.remove.bind(controller));

module.exports = Router;
