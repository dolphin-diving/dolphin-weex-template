let baseURL
/**
 * [ENV description]
 * @type {Number}
 * 1 playground生产环境
 * 2 link生产环境
 */
let ENV = 2

switch (ENV) {
  case 1:
    baseURL = 'http://10.73.32.39:8081/'
    break
  case 2:
    // 测试环境
    baseURL = 'http://dolphin-weex.c1-midea.com:8081/'

    break
  case 3:
    // 正式环境
    baseURL = 'https://dolphin.midea.com/dolphin-weex/'
    break
  default:
    // statements_def
    break
}

export { baseURL, ENV }
