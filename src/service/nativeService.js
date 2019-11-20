const mm = weex.requireModule('modal')
const navigator = weex.requireModule('navigator')
const stream = weex.requireModule('stream')
const storage = weex.requireModule('storage')
const bridgeModule = weex.requireModule('bridgeModule')
const blueToothModule = weex.requireModule('blueToothModule')
const blueToothMeshModule = weex.requireModule('blueToothMeshModule')
const globalEvent = weex.requireModule('globalEvent')

const isIos = weex.config.env.platform == 'iOS' ? true : false
import debugUtil from 'src/util/debugUtil'
import util from 'src/util/util'

var isDummy = false
// import Mock from 'src/mock'  //正式场上线时注释掉

const debugLogSeperator = '**************************************\n'

var isDummy = util.getParameters(weex.config.bundleUrl, 'isDummy') == 'true'

const platform = weex.config.env.platform
if (platform == 'Web') {
  isDummy = true
}
console.log('isDummy:' + isDummy)
var isRemote = weex.config.bundleUrl.indexOf('http') > -1 ? true : false

export default {
  serviceList: {
    test: 'commonservice'
  },
  Mock: {},
  isDummy: isDummy,
  //**********Util方法***************START
  convertToJson(str) {
    let result = str
    if (typeof str == 'string') {
      try {
        result = JSON.parse(str)
      } catch (error) {
        console.error(error)
      }
    }
    return result
  },
  getParameters(key) {
    let theRequest = new Object()
    let bundleUrl = weex.config.bundleUrl
    let queryString = ''
    if (bundleUrl.indexOf('?') != -1) {
      queryString = bundleUrl.substr(bundleUrl.indexOf('?') + 1)
      let strs = queryString.split('&')
      for (let i = 0; i < strs.length; i++) {
        theRequest[strs[i].split('=')[0]] = decodeURIComponent(strs[i].split('=')[1])
      }
    }
    return key ? theRequest[key] : theRequest
  },
  //**********Util方法***************END

  //**********页面跳转接口***************START
  /*
    params:
        path - 跳转页面路径（以插件文件夹为根目录的相对路径）
        options: {
            animated: true/false, - 是否需要跳转动画
            replace: true/false, - 跳转后是否在历史栈保留当前页面
            viewTag: string - 给跳转后的页面设置标识，可用于goBack时指定返回页面
            transparent: 'true/false', //新页面背景是否透明
            animatedType: 'slide_bottomToTop' //新页面出现动效类型
        }

    */
  goTo(path, options, params) {
    var url
    if (params) {
      path +=
        (path.indexOf('?') == -1 ? '?' : '&') +
        Object.keys(params)
          .map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k] || ''))
          .join('&')
    }
    // mm.toast({ message: isRemote, duration: 2 })
    if (this.isDummy != true && !isRemote) {
      //手机本地页面跳转
      this.getPath(weexPath => {
        //weexPath为当前页面目录地址
        // url = weexPath + path;
        let weexPathArray = weexPath.split('/')
        let pathArray = path.split('/')
        if (weexPathArray[weexPathArray.length - 2] == pathArray[0]) {
          pathArray.shift()
          if (weexPathArray[weexPathArray.length - 3] == pathArray[0]) {
            pathArray.shift()
            if (weexPathArray[weexPathArray.length - 4] == pathArray[0]) {
              pathArray.shift()
            }
          }
          url = weexPathArray.join('/') + pathArray.join('/')
        } else {
          url = weexPath + path
        }
        this.runGo(url, options)
      })
    } else if (platform != 'Web') {
      //手机远程weex页面调试跳转
      this.getPath(weexPath => {
        //weexPath为当前页面目录地址
        let weexPathArray = weexPath.split('/')
        let pathArray = path.split('/')
        if (weexPathArray[weexPathArray.length - 2] == pathArray[0]) {
          pathArray.shift()
          if (weexPathArray[weexPathArray.length - 3] == pathArray[0]) {
            pathArray.shift()
            if (weexPathArray[weexPathArray.length - 4] == pathArray[0]) {
              pathArray.shift()
            }
          }
          url = weexPathArray.join('/') + pathArray.join('/')
        } else {
          url = weexPath + path
        }
        if (url.indexOf('?') != -1) {
          url += '&isDummy=' + isDummy
        } else {
          url += '?isDummy=' + isDummy
        }
        this.runGo(url, options)
      })
    } else {
      //PC网页调试跳转
      location.href = location.origin + location.pathname + '?path=' + path.replace('?', '&')
    }
  },
  runGo(url, options) {
    // mm.toast({ message: url, duration: 2 })
    if (!options) {
      options = {
        animated: 'true',
        replace: 'false'
      }
    } else {
      if (typeof options.animated == 'boolean') {
        options.animated = options.animated ? 'true' : 'false'
      }
      if (typeof options.replace == 'boolean') {
        options.replace = options.replace ? 'true' : 'false'
      }
    }
    let params = Object.assign(options, {
      url: url
    })
    // this.toast(params)
    navigator.push(params, event => {})
  },
  /*
        取得当前weex页面的根路径
    */
  getPath(callBack) {
    if (this.isDummy != true && !isRemote) {
      bridgeModule.getWeexPath(resData => {
        var jsonData = JSON.parse(resData)
        var weexPath = jsonData.weexPath
        callBack(weexPath)
      })
    } else if (platform != 'Web') {
      //手机远程weex页面调试
      let rootPath = weex.config.bundleUrl.match(new RegExp('(.*/).*.js', 'i'))
      callBack(rootPath ? rootPath[1] : weex.config.bundleUrl)
    } else {
      //PC网页调试跳转
      location.href = location.origin + location.pathname + '?path=' + path
    }
  },
  getWeexPath() {
    return new Promise((resolve, reject) => {
      bridgeModule.getWeexPath(resData => {
        resolve(this.convertToJson(resData))
      })
    })
  },
  /*
    options = {
            animated: 'true',
            animatedType: 'slide_topToBottom' //页面关闭时动效类型
    }*/
  goBack(options = {}) {
    var params = Object.assign(
      {
        animated: 'true'
      },
      options
    )
    // this.toast(params)
    navigator.pop(params, event => {})
  },
  backToNative() {
    bridgeModule.backToNative()
  },
  //**********页面跳转接口***************END

  //**********非APP业务接口***************START
  generateUUID() {
    var d = new Date().getTime()
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = (d + Math.random() * 16) % 16 | 0
      d = Math.floor(d / 16)
      return (c == 'x' ? r : (r & 0x3) | 0x8).toString(16)
    })
    return uuid
  },
  genMessageId() {
    var messageId = ''
    for (var i = 0; i < 8; i++) {
      messageId += Math.floor(Math.random() * 10).toString()
    }
    return messageId
  },
  getItem(key, callback) {
    storage.getItem(key, callback)
  },
  setItem(key, value, callback) {
    let temp
    if (typeof value == 'object') {
      temp = JSON.stringify(value)
    }
    let defaultCallback = event => {
      console.log('set success')
    }
    storage.setItem(key, temp || value, callback || defaultCallback)
  },
  removeItem(key, callback) {
    storage.removeItem(key, () => {
      if (callback) callback()
    })
  },
  toast(message, duration) {
    if (typeof message == 'object') {
      message = JSON.stringify(message)
    }
    if (platform == 'Web') {
      mm.toast({ message: message, duration: duration || 1.5 })
    } else {
      bridgeModule.toast({ message: message, duration: duration || 1.5 })
    }
  },
  alert(message, callback, okTitle) {
    var callbackFunc = callback || function(value) {}

    if (typeof message == 'object') {
      try {
        message = JSON.stringify(message)
      } catch (error) {}
    }
    mm.alert(
      {
        message: message,
        okTitle: okTitle || '确定'
      },
      function(value) {
        callbackFunc(value)
      }
    )
  },
  confirm(message, callback, okTitle, cancelTitle) {
    mm.confirm(
      {
        message: message,
        okTitle: okTitle || '确定',
        cancelTitle: cancelTitle || '取消'
      },
      result => {
        callback(result)
      }
    )
  },
  showLoading() {
    if (this.isDummy != true) {
      bridgeModule.showLoading()
    }
  },
  hideLoading() {
    if (this.isDummy != true) {
      bridgeModule.hideLoading()
    }
  },
  showLoadingWithMsg(option) {
    if (this.isDummy != true) {
      let params = option
      if (typeof option == 'string') {
        params = {
          msg: option
        }
      }
      bridgeModule.showLoadingWithMsg(params)
    }
  },
  hideLoadingWithMsg() {
    if (this.isDummy != true) {
      bridgeModule.hideLoadingWithMsg()
    }
  },
  //隐藏系统导航栏
  setNavBarHidden() {
    navigator.setNavBarHidden(
      {
        hidden: '1',
        animated: 'false'
      },
      event => {}
    )
  },
  //关闭键盘
  killKeyboard() {
    if (this.isDummy != true) {
      bridgeModule.killKeyboard()
    }
  },
  //**********非APP业务接口***************END

  //**********网络请求接口***************START
  //发送智慧云网络请求：此接口固定Post到智慧云https地址及端口
  sendMCloudRequest(name, params, options = { isShowLoading: true, isValidate: true }) {
    return new Promise((resolve, reject) => {
      var self = this
      if (this.isDummy != true) {
        this.getItem('masterId', resdata => {
          let msgid = self.genMessageId()
          var masterId = resdata.data
          var sendData = {}
          sendData.url = self.serviceList[name] ? self.serviceList[name] : name
          sendData.params = Object.assign(
            {
              applianceId: masterId + '',
              msgid: msgid
            },
            params
          )
          if (options.isShowLoading) {
            this.showLoading()
          }
          bridgeModule.sendMCloudRequest(
            sendData,
            resData => {
              debugUtil.debugLog(debugLogSeperator, `request(${msgid}): `, sendData)
              debugUtil.debugLog(`response(${msgid}): `, resData, debugLogSeperator)
              if (typeof resData == 'string') {
                resData = JSON.parse(resData)
              }
              if (options.isShowLoading) {
                this.hideLoading()
              }

              if (options.isValidate) {
                //resData.status为5.0判断；resData.errorCode为4.判断
                if (resData.errorCode == 0) {
                  resolve(resData)
                } else if (resData.status === true) {
                  resolve(resData)
                } else {
                  reject(resData)
                }
              } else {
                resolve(resData)
              }
            },
            error => {
              debugUtil.debugLog(debugLogSeperator, `request(${msgid}): `, sendData)
              debugUtil.debugLog(`=======> error(${msgid}): `, error, debugLogSeperator)
              if (options.isShowLoading) {
                this.hideLoading()
              }
              if (typeof error == 'string') {
                error = JSON.parse(error)
              }
              reject(error)
            }
          )
        })
      } else {
        let resData = this.Mock.getMock(self.serviceList[name] ? self.serviceList[name] : name)
        if (options.isValidate) {
          //resData.status为5.0判断；resData.errorCode为4.判断
          if (resData.errorCode == 0) {
            resolve(resData)
          } else if (resData.status === true) {
            resolve(resData)
          } else {
            reject(resData)
          }
        } else {
          resolve(resData)
        }
      }
    })
  },

  //^5.0.0发送中台网络请求：此接口固定Post到中台https地址及端口
  sendCentralCloundRequest(name, params, options = { isShowLoading: true }) {
    return new Promise((resolve, reject) => {
      if (this.isDummy != true) {
        let msgid = this.genMessageId()
        var sendData = params || {}
        sendData.url = this.serviceList[name] ? this.serviceList[name] : name
        if (options.isShowLoading) {
          this.showLoading()
        }
        bridgeModule.sendCentralCloundRequest(
          sendData,
          resData => {
            debugUtil.debugLog(debugLogSeperator, `request(${msgid}): `, sendData)
            debugUtil.debugLog(`response(${msgid}): `, resData, debugLogSeperator)
            if (typeof resData == 'string') {
              try {
                resData = JSON.parse(resData)
              } catch (e) {}
            }
            if (options.isShowLoading) {
              this.hideLoading()
            }

            resolve(resData)
          },
          error => {
            debugUtil.debugLog(debugLogSeperator, `request(${msgid}): `, sendData)
            debugUtil.debugLog(`=======> error(${msgid}): `, error, debugLogSeperator)
            if (options.isShowLoading) {
              this.hideLoading()
            }
            if (typeof error == 'string') {
              try {
                error = JSON.parse(error)
              } catch (e) {}
            }
            reject(error)
          }
        )
      } else {
        let resData = this.Mock.getMock(this.serviceList[name] ? this.serviceList[name] : name)
        resolve(resData)
      }
    })
  },
  //发送POST网络请求：URL自定义
  /* params: {
        url: url,
        type: 'text',
        method: "POST",
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: {
            'objectId': objectId,
            'format': 'base64'
        }
    } */
  sendHttpRequest(params, options = { isShowLoading: true, isValidate: true }) {
    return new Promise((resolve, reject) => {
      let requestParams = JSON.parse(JSON.stringify(params))
      var self = this
      if (this.isDummy != true) {
        let defaultParams = {
          method: 'POST',
          type: 'json'
        }
        requestParams = Object.assign(defaultParams, requestParams)

        /* body 参数仅支持 string 类型的参数，请勿直接传递 JSON，必须先将其转为字符串。
                GET 请求不支持 body 方式传递参数，请使用 url 传参。 */
        if (requestParams.body && requestParams.method == 'GET') {
          let bodyStr = this.convertRequestBody(requestParams.body)
          if (requestParams.url.indexOf('?') > -1) {
            requestParams.url += '&' + bodyStr
          } else {
            requestParams.url += '?' + bodyStr
          }
          requestParams.body = ''
        } else if (requestParams.body && requestParams.method == 'POST') {
          requestParams.body = requestParams.body
        }

        if (options.isShowLoading) {
          this.showLoading()
        }
        let msgid = self.genMessageId()

        stream.fetch(requestParams, resData => {
          debugUtil.debugLog(debugLogSeperator, `request(${msgid}): `, requestParams)
          debugUtil.debugLog(`response(${msgid}): `, resData, debugLogSeperator)
          if (options.isShowLoading) {
            this.hideLoading()
          }
          if (!resData.ok) {
            if (typeof resData == 'string') {
              resData = JSON.parse(resData)
            }
            reject(resData)
          } else {
            let result = resData.data
            if (typeof result == 'string') {
              result = JSON.parse(result)
            }
            resolve(result)
          }
        })
      } else {
        let resData = this.Mock.getMock(params.url)
        resolve(resData)
      }
    })
  },
  convertRequestBody(obj) {
    var param = ''
    for (const name in obj) {
      if (typeof obj[name] != 'function') {
        param += '&' + name + '=' + encodeURI(obj[name])
      }
    }
    return param.substring(1)
  },
  //发送指令透传接口
  startCmdProcess(name, messageBody, callback, callbackFail) {
    let commandId = Math.floor(Math.random() * 1000)
    var param = {
      commandId: commandId
    }
    if (messageBody != undefined) {
      param.messageBody = messageBody
    }
    var finalCallBack = function(resData) {
      if (typeof resData == 'string') {
        resData = JSON.parse(resData)
      }
      if (resData.errorCode != 0) {
        callbackFail(resData)
      } else {
        callback(resData.messageBody)
      }
    }
    var finalCallbackFail = function(resData) {
      if (typeof resData == 'string') {
        resData = JSON.parse(resData)
      }
      callbackFail(resData)
    }
    if (this.isDummy != true) {
      if (isIos) {
        this.createCallbackFunctionListener()
        this.callbackFunctions[commandId] = finalCallBack
        this.callbackFailFunctions[commandId] = finalCallbackFail
      }
      bridgeModule.startCmdProcess(JSON.stringify(param), finalCallBack, finalCallbackFail)
    } else {
      callback(this.Mock.getMock(name).messageBody)
    }
  },

  //发送指令透传接口(套系)
  startCmdProcessTX(name, messageBody, deviceId, callback, callbackFail) {
    let commandId = Math.floor(Math.random() * 1000)
    var param = {
      commandId: commandId
    }
    if (messageBody != undefined) {
      param.messageBody = messageBody
    }
    if (deviceId != undefined) {
      param.deviceId = deviceId
    }
    var finalCallBack = function(resData) {
      if (typeof resData == 'string') {
        resData = JSON.parse(resData)
      }
      if (resData.errorCode != 0) {
        callbackFail(resData)
      } else {
        callback(resData.messageBody)
      }
    }
    var finalCallbackFail = function(resData) {
      if (typeof resData == 'string') {
        resData = JSON.parse(resData)
      }
      callbackFail(resData)
    }
    if (this.isDummy != true) {
      if (isIos) {
        this.createCallbackFunctionListener()
        this.callbackFunctions[commandId] = finalCallBack
        this.callbackFailFunctions[commandId] = finalCallbackFail
      }
      bridgeModule.startCmdProcess(JSON.stringify(param), finalCallBack, finalCallbackFail)
    } else {
      callback(this.Mock.getMock(name).messageBody)
    }
  },
  /* 服务透传接口。提供给插件发送请求至事业部的品类服务器。此接口美居APP会将请求内容加密，然后发送给“云平台”进行中转发送至事业部品类服务器。
        params: {
            type:服务类型，如果weex没有传，或者传入类似""的空字节，则取当前插件类型作为该数值
            queryStrings:与H5内容一致
            transmitData:与H5内容一致
        }
    */
  requestDataTransmit(params) {
    return new Promise((resolve, reject) => {
      bridgeModule.requestDataTransmit(
        JSON.stringify(params),
        resData => {
          resolve(this.convertToJson(resData))
        },
        error => {
          reject(error)
        }
      )
    })
  },

  /* *****即将删除, IOS已经做了改进，不在需要已callbackFunction回调callback ********/
  isCreateListener: false,
  createCallbackFunctionListener() {
    if (!this.isCreateListener) {
      this.isCreateListener = true
      globalEvent.addEventListener('callbackFunction', result => {
        //IOS消息返回处理
        var commandId = result.commandId
        if (commandId) {
          this.callbackFunction(commandId, result)
        }
      })
    }
  },
  callbackFunctions: {},
  callbackFailFunctions: {},
  callbackFunction(commandId, result) {
    var jsonResult = result
    var cbf = this.callbackFunctions[commandId]
    var cbff = this.callbackFailFunctions[commandId]
    if (jsonResult.errorCode !== undefined && jsonResult.errMessage == 'TimeOut') {
      if (typeof cbff == 'function') {
        cbff(-1) //表示指令超时 －1
      }
    } else {
      if (typeof cbf == 'function') {
        cbf(jsonResult)
      }
    }
    delete this.callbackFunctions[commandId]
    delete this.callbackFailFunctions[commandId]
  },
  /* *****即将删除, IOS已经做了改进，不在需要已callbackFunction回调callback ********/

  //发送Lua指令接口ƒ
  sendLuaRequest(params, isShowLoading = true) {
    return new Promise((resolve, reject) => {
      if (!params.operation) {
        params.operation = 'luaQuery' //luaQuery or luaControl
      }
      if (!params.params) {
        params.params = {}
      }

      if (this.isDummy != true) {
        if (isShowLoading) {
          this.showLoading()
        }
        let msgid = this.genMessageId()
        bridgeModule.commandInterface(
          JSON.stringify(params),
          resData => {
            debugUtil.debugLog(debugLogSeperator, `Lua request(${msgid}): `, params)
            debugUtil.debugLog(`Lua response(${msgid}):`, resData, debugLogSeperator)
            if (typeof resData == 'string') {
              resData = JSON.parse(resData)
            }
            if (isShowLoading) {
              this.hideLoading()
            }
            if (resData.errorCode == 0) {
              //成功
              resolve(resData)
            } else {
              reject(resData)
            }
          },
          error => {
            // this.alert(error)
            debugUtil.debugLog(debugLogSeperator, `Lua request(${msgid}): `, params)
            debugUtil.debugLog(`=======> Lua error(${msgid}): `, error, debugLogSeperator)
            if (isShowLoading) {
              this.hideLoading()
            }
            if (typeof error == 'string') {
              error = JSON.parse(error)
            }
            reject(error)
          }
        )
      } else {
        let resData
        if (params['operation'] || params['name']) {
          if (params['name']) {
            resData = Mock.getMock(params['name'])
          } else {
            resData = Mock.getMock(params['operation'])
          }
        }
        debugUtil.debugLog('Mock: ', resData)
        resolve(resData)
      }
    })
  },
  //**********网络请求接口***************END

  //**********APP业务接口***************START
  updateTitle(title, showLeftBtn, showRightBtn) {
    var params = {
      title: title,
      showLeftBtn: showLeftBtn,
      showRightBtn: showRightBtn
    }
    if (this.isDummy != true) {
      bridgeModule.updateTitle(JSON.stringify(params))
    }
  },
  getAuthToken() {
    return new Promise((resolve, reject) => {
      bridgeModule.getAuthToken(
        {},
        resData => {
          resolve(this.convertToJson(resData))
        },
        error => {
          reject(error)
        }
      )
    })
  },
  // 获取套系列表
  getTxList(isShowLoading = true) {
    // if (this.isDummy != true) {
    return new Promise((resolve, reject) => {
      if (isShowLoading) {
        this.showLoading()
      }
      bridgeModule.getTXList(
        {},
        resData => {
          if (typeof resData == 'string') {
            // this.alert(resData)
            var resDataObj = JSON.parse(resData)
            if (isShowLoading) {
              this.hideLoading()
            }
            if (resDataObj.errorCode && resDataObj.errorCode !== 0) {
              //失败
              reject(resDataObj)
            } else {
              //成功
              resolve(resDataObj)
            }
          } else {
            //Android 可能直接传个对象
            var resDataObj = resData
            if (isShowLoading) {
              this.hideLoading()
            }
            if (resDataObj.errorCode && resDataObj.errorCode !== 0) {
              //失败
              reject(resDataObj)
            } else {
              //成功
              resolve(resDataObj)
            }
          }
        },
        error => {
          if (typeof error == 'string') {
            error = JSON.parse(error)
            mm.modal({ message: error }, 3)
          }
          reject(error)
        }
      )
    })
    // }else{
    //     return new Promise((resolve, reject) => {
    //         let data = Mock.getMock('queryTXList');
    //         resolve(data)
    //     })
    // }
  },
  showSharePanel(params, callback, callbackFail) {
    return new Promise((resolve, reject) => {
      bridgeModule.showSharePanel(
        params,
        resData => {
          resolve(resData)
        },
        error => {
          reject(error)
        }
      )
    })
  },

  /*
   * created by zhouhg 20180621 start
   */
  //根据设备信息获取插件信息
  getDevicePluginInfo(params) {
    return new Promise((resolve, reject) => {
      if (this.isDummy != true) {
        bridgeModule.getDevicePluginInfo(
          params,
          resData => {
            resolve(resData)
          },
          error => {
            reject(error)
          }
        )
      } else {
        let data = Mock.getMock('getDevicePluginInfo')
        resolve(data)
      }
    })
  },
  //下载插件接口
  downLoadDevicePlugin(params, callback, callbackFail) {
    let that = this
    if (this.isDummy != true) {
      bridgeModule.downLoadDevicePlugin(
        params,
        resData => {
          callback(resData)
        },
        error => {
          callbackFail(error)
        }
      )
    } else {
      let data = Mock.getMock('downLoadDevicePlugin')
      setTimeout(function() {
        callback(data)
      }, 3000)
    }
  },
  getDeviceOnlineStatus(params, callback, callbackFail) {
    return new Promise((resolve, reject) => {
      let that = this
      bridgeModule.getDeviceOnlineStatus(
        params,
        resData => {
          resolve(resData)
        },
        error => {
          reject(error)
        }
      )
    })
  },
  //设备主动上报在线离线状态
  deviceOnlineStatus() {
    let params = {
      operation: 'deviceOnlineStatus'
    }
    return this.commandInterfaceWrapper(params)
  },
  //更新下载插件并解压后，需要替换加载新下载的插件
  loadingLatestPlugin(params, callback, callbackFail) {
    //  	let params = {};
    return new Promise((resolve, reject) => {
      bridgeModule.loadingLatestPlugin(
        params,
        resData => {
          resolve(resData)
        },
        error => {
          reject(error)
        }
      )
    })
  },
  //重新加载当前页面
  reload(callback, callbackFail) {
    let params = {}
    bridgeModule.reload(
      params,
      resData => {
        if (callback) callback(resData)
      },
      error => {
        if (callbackFail) callbackFail(error)
      }
    )
  },
  /*
   * created by zhouhg 20180621 end
   */

  //统一JS->Native接口
  commandInterfaceWrapper(param) {
    return new Promise((resolve, reject) => {
      bridgeModule.commandInterface(
        JSON.stringify(param),
        resData => {
          resolve(this.convertToJson(resData))
        },
        error => {
          reject(error)
        }
      )
    })
  },
  //获取用户信息
  getUserInfo() {
    let param = {
      operation: 'getUserInfo'
    }
    return this.commandInterfaceWrapper(param)
  },
  //打电话
  /* param: {
        tel: '10086',
        title: '客户服务',
        desc: '拨打热线电话：'
    } */
  callTel(params) {
    let param = Object.assign(params, {
      operation: 'callTel'
    })
    return this.commandInterfaceWrapper(param)
  },
  //弹出全局电话列表
  /* param: [{
        tel: '10086',
        title: '客户服务',
        desc: '拨打热线电话：'
    },{...}] */
  callTelList(params) {
    let param = {
      operation: 'callTelList',
      params: params
    }
    return this.commandInterfaceWrapper(param)
  },
  //触发手机震动  intensity 1：轻微震动 2：中等震动 3：强烈震动  intensity为空：猛烈♂震动
  hapticFeedback(intensity) {
    let param
    if (intensity && typeof intensity == 'number') {
      param = {
        operation: 'hapticFeedback',
        intensity: intensity
      }
    } else {
      param = {
        operation: 'hapticFeedback'
      }
    }
    return this.commandInterfaceWrapper(param)
  },
  //打开指定的系统设置，比如蓝牙
  openNativeSystemSetting(settingName) {
    let param = {
      operation: 'openNativeSystemSetting',
      setting: settingName || 'bluetooth'
    }
    return this.commandInterfaceWrapper(param)
  },
  shareMsg(params) {
    /* params =  {
            "type": "wx", //分享类型，wx表示微信分享，qq表示qq分享，sms表示短信分享，weibo表示新浪微博，qzone表示QQ空间，wxTimeline表示微信朋友圈
            "title": "xxxxxx", //分享的标题
            "desc": "xxxxxx",//分享的文本内容
            "imgUrl": "xxxxxx",//分享的图片链接
            "link": "xxxxxx" //分享的跳转链接
        } */
    let param = {
      operation: 'shareMsg',
      params: params
    }
    return this.commandInterfaceWrapper(param)
  },
  //获取当前设备网络信息
  getNetworkStatus() {
    let param = {
      operation: 'getNetworkStatus'
    }
    return this.commandInterfaceWrapper(param)
  },
  //获取当前家庭信息
  getCurrentHomeInfo() {
    let param = {
      operation: 'getCurrentHomeInfo'
    }
    return this.commandInterfaceWrapper(param)
  },
  //获取当前设备信息
  getDeviceInfo() {
    let param = {
      operation: 'getDeviceInfo'
    }
    if (this.isDummy == true) {
      return new Promise((resolve, reject) => {
        try {
          let resData = Mock.getMock(param.operation)
          if (resData.errorCode == 0) {
            resolve(resData)
          } else {
            reject(resData)
          }
        } catch (error) {
          reject('获取模拟数据出错')
        }
      })
    } else {
      return this.commandInterfaceWrapper(param)
    }
  },
  //更新当前设备信息
  updateDeviceInfo(params) {
    let param = Object.assign(params, {
      operation: 'updateDeviceInfo'
    })
    return this.commandInterfaceWrapper(param)
  },
  //打开指定的原生页面
  jumpNativePage(params) {
    /* params =  {
            "pageName": "xxxx", //跳转的目标页面
            "data": {xxxxxx}, //传参，为json格式字符串
        } */
    let param = Object.assign(params, {
      operation: 'jumpNativePage'
    })
    return this.commandInterfaceWrapper(param)
  },
  //跳转到h5页面
  weexBundleToWeb(params) {
    /* params =  {
            url: "xxxx", //跳转的目标页面
            title: "h5标题"
        } */
    let param = Object.assign(params, {
      operation: 'weexBundleToWeb'
    })
    return this.commandInterfaceWrapper(param)
  },
  //设置是否监控安卓手机物理返回键功能, v4.4.0
  setBackHandle(status) {
    /* params =  {
            "pageName": "xxxx", //跳转的目标页面
            "isMonitor": on,  //on: 打开监控，off: 关闭监控
        } */
    let params = {
      operation: 'setBackHandle',
      isMonitor: status
    }
    return this.commandInterfaceWrapper(params)
  },
  //二维码/条形码扫码功能，用于读取二维码/条形码的内容
  scanCode(params = {}) {
    let param = Object.assign(params, {
      operation: 'scanCode'
    })
    return this.commandInterfaceWrapper(param)
  },
  //开启麦克风录音，可以保存录音文件或者把声音转换成文字
  startRecordAudio(params) {
    /* params =  {
            max:number, //最长录音时间, 单位为秒
            isSave:true/false, //是否保存语音录音文件
            isTransform:true/false, //是否需要转换语音成文字
        } */
    let param = Object.assign(params, {
      operation: 'startRecordAudio'
    })
    return this.commandInterfaceWrapper(param)
  },
  //开启麦克风录音后，自行控制结束录音
  stopRecordAudio() {
    let params = {
      operation: 'stopRecordAudio'
    }
    return this.commandInterfaceWrapper(params)
  },
  takePhoto(params) {
    /* params =  {
            compressRage:60, , //number, 返回照片的压缩率，范围为0~100，数值越高保真率越高
            type:'jpg', //值为jpg或png，指定返回相片的格式
            isNeedBase64: true/false //是否需要返回相片base64数据
        } */
    let param = Object.assign(params, {
      operation: 'takePhoto'
    })
    return this.commandInterfaceWrapper(param)
  },
  /* 选择相册照片，并返回相片数据 */
  choosePhoto(params) {
    /* params =  {
            compressRage:60, , //number, 返回照片的压缩率，范围为0~100，数值越高保真率越高
            type:'jpg', //值为jpg或png，指定返回相片的格式
            isNeedBase64: true/false //是否需要返回相片base64数据
        } */
    let param = Object.assign(params, {
      operation: 'choosePhoto'
    })
    return this.commandInterfaceWrapper(param)
  },
  /* 选择多张相册照片，并返回相片数据，不支持base64的转换 */
  chooseMulPhoto(params) {
    /* params =  {
            max:number, //一次最多可选择的数量，默认为9，最多9张。
        } */
    let param = Object.assign(params, {
      operation: 'chooseMulPhoto'
    })
    return this.commandInterfaceWrapper(param)
  },
  getGPSInfo(params) {
    /* params =  {
            desiredAccuracy: "10",  //定位的精确度，单位：米
            alwaysAuthorization: "0",  //是否开启实时定位功能，0: 只返回一次GPS信息（默认），1:APP在前台时，每移动distanceFilter的距离返回一次回调。2:无论APP在前后台，每移动distanceFilter的距离返回一次回调（注意耗电）
            distanceFilter: "10", //alwaysAuthorization为1或2时有效，每移动多少米回调一次定位信息
        } */
    let param = Object.assign(params, {
      operation: 'getGPSInfo'
    })
    return this.commandInterfaceWrapper(param)
  },
  getCityInfo(params) {
    let param = Object.assign(params, {
      operation: 'getCityInfo'
    })
    return this.commandInterfaceWrapper(param)
  },
  /*  ^5.0.0 根据getCityInfo获得的城市对应的气象局ID获取城市天气信息， 比如温度， 风向等信息 */
  getWeatherInfo(params) {
    let param = Object.assign(params, {
      operation: 'getWeatherInfo'
    })
    return this.commandInterfaceWrapper(param)
  },
  /*  ^5.0.0  百度开放接口，通过经纬度返回对应的位置信息 */
  baiduGeocoder(params) {
    let param = Object.assign(params, {
      operation: 'baiduGeocoder'
    })
    return this.commandInterfaceWrapper(param)
  },
  //获取登录态信息
  getLoginInfo() {
    let param = {
      operation: 'getLoginInfo'
    }
    return this.commandInterfaceWrapper(param)
  },
  /* ^5.0.0 打开用户手机地图软件，传入标记地点。（打开地图软件后，用户可以使用地图软件的功能，比如导航等）
    ios: 如果用户安装了百度地图，则跳转到百度地图app，没有安装，则跳转Safar，使用网页导航
    android: 如果用户安装了百度地图，则跳转到百度地图app，没有安装，则跳转使用外部浏览器，使用网页导航（用户选择合适的浏览器，原生toast引导，存在选择错误应用的风险） */
  launchMapApp(params) {
    /* params =  {
            from:{ //当前用户地点
                latitude: string, //纬度
                longitude: string //经度
            },
            to:{ //目的地地点
                latitude: string, //纬度
                longitude: string //经度
            }
        } */
    let param = Object.assign(params, {
      operation: 'launchMapApp'
    })
    return this.commandInterfaceWrapper(param)
  },
  /* 根据模糊地址，返回地图服务的查询结果数据。 */
  searchMapAddress(params) {
    /* params =  {
            city: "", //需要查询的城市(范围)
            keyword: "美的" //需要查询的地址
        } */
    let param = Object.assign(params, {
      operation: 'searchMapAddress'
    })
    return this.commandInterfaceWrapper(param)
  },
  /* 选择通讯录的好友，可以获取电话号码，好友信息 */
  getAddressBookPerson() {
    let param = {
      operation: 'getAddressBookPerson'
    }
    return this.commandInterfaceWrapper(param)
  },

  downloadImageWithCookie(params) {
    let param = Object.assign(params, {
      operation: 'downloadImageWithCookie'
    })
    return this.commandInterfaceWrapper(param)
  },

  //调用第三方SDK统一接口
  interfaceForThirdParty(...args) {
    bridgeModule.interfaceForThirdParty(...args)
  },
  //
  updateAutoList() {
    bridgeModule.updateAutoList()
  },
  /*发送埋点数据*/
  burialPoint(params) {
    let param = Object.assign(params, {
      operation: 'burialPoint'
    })
    return this.commandInterfaceWrapper(param)
  },
  /* weex卡片页打开控制页页面接口 */
  showControlPanelPage(params = {}) {
    bridgeModule.showControlPanelPage(params)
  },
  /* 上传图片文件，调用一次，上传一份图片文件 */
  uploadImgFile(params, callback, callbackFail) {
    /* params = {
            path: string, //值为 图片在手机中的路径
            url: string, //值为服务器上传图片的url
            maxWidth: number, //最大宽度，如果不设置，则使用图片宽度
            maxHeight: number, //最大高度，如果不设置，则使用图片高度
            compressRage: number, //图片的压缩率，范围为0~100，数值越高保真率越高。默认值：100，不压缩，直接上传图片 ps: 压缩后的图片文件格式，固定为jpg 格式
            netParam: {
                xxx: xxx, //weex需要原生填充给服务器的post 表单参数1
                xxx: xxx, //weex需要原生填充给服务器的post 表单参数2
            },
            fileKey: string, //值为原生在post表单中传输图片文件的key值，缺省默认值为“file”
        } */
    let param = Object.assign(params, {
      operation: 'uploadImgFile'
    })
    bridgeModule.commandInterface(param, callback, callbackFail)
  },
  uploadImgFileToMas(params, callback, callbackFail) {
    /* params = {
            path: string, //值为 图片在手机中的路径
            url: string, //值为服务器上传图片的url
            maxWidth: number, //最大宽度，如果不设置，则使用图片宽度
            maxHeight: number, //最大高度，如果不设置，则使用图片高度
            compressRage: number, //图片的压缩率，范围为0~100，数值越高保真率越高。默认值：100，不压缩，直接上传图片 ps: 压缩后的图片文件格式，固定为jpg 格式
            netParam: {
                xxx: xxx, //weex需要原生填充给服务器的post 表单参数1
                xxx: xxx, //weex需要原生填充给服务器的post 表单参数2
            },
            fileKey: string, //值为原生在post表单中传输图片文件的key值，缺省默认值为“file”
        } */
    let param = Object.assign(params, {
      operation: 'uploadImgFileToMas'
    })
    bridgeModule.commandInterface(param, callback, callbackFail)
  },
  //LottieView接口
  showLottieView() {},
  /* setIdleTimerDisabled 设置屏幕常亮 ^5.7
        1.插件调用setIdleTimerDisabled,原生APP定时60秒后重新开启系统自动屏灭的操作。
        1.1 假如插件要长时间保持屏亮，需要调用setIdleTimerDisabled后，隔60秒后再次调用来维持一直屏亮。
        1.2 插件调用setIdleTimerDisabled，间隔不到60秒又调用setIdleTimerDisabled，原生app的定时时间，重新设置，60秒后再重新启动系统的自动灭屏操作！
    */
  setIdleTimerDisabled() {
    let param = {
      operation: 'setIdleTimerDisabled'
    }
    bridgeModule.commandInterface(param, function() {}, function() {})
  },
  /*
   * ^5.7.0 [subscribeMessage]-订阅设备状态推送
   * @params: { deviceId: []}
   * deviceId是想订阅的设备id,空数组-清空订阅设备，['all']-订阅用户该家庭所有设备消息推送， [deviceId]订阅指定设备
   */
  subscribeMessage(params) {
    let param = Object.assign(params, {
      operation: 'subscribeMessage'
    })
    return this.commandInterfaceWrapper(param)
  },
  //**********APP业务接口***************END

  //**********蓝牙接口***************START
  blueToothModuleWrapper(apiName, param) {
    return new Promise((resolve, reject) => {
      blueToothModule[apiName](
        JSON.stringify(param),
        resData => {
          resolve(this.convertToJson(resData))
        },
        error => {
          reject(error)
        }
      )
    })
  },
  //获取蓝牙开启状态
  /* return:
        {status:1, //1表示蓝牙已打开，0：蓝牙关闭状态，2:：蓝牙正在重置，3：设备不支持蓝牙，4：蓝牙未授权}
    */
  getBlueStatus(params = {}) {
    return this.blueToothModuleWrapper('getBlueStatus', params)
  },
  //开始扫描蓝牙
  /*  param:{duration: number //持续时间, 单位：秒}
        当扫描到的蓝牙设备（蓝牙信息），app-->插件:
        receiveMessageFromApp({messageType:"blueScanResult",messageBody:{name:"xxx", deviceKey:"xxxxx"}})
     */
  startBlueScan(params = {}) {
    return this.blueToothModuleWrapper('startBlueScan', params)
  },
  //停止蓝牙扫描
  /* 当扫描结束（停止或超时），app -> 插件:
    receiveMessageFromApp({ messageType: "blueScanStop", messageBody: {} })
    */
  stopBlueScan(params = {}) {
    return this.blueToothModuleWrapper('stopBlueScan', params)
  },
  //保存蓝牙信息
  /* param:{deviceType:品类码, name:"xxx", deviceKey:"xxxxx"} */
  addDeviceBlueInfo(params = {}) {
    return this.blueToothModuleWrapper('addDeviceBlueInfo', params)
  },
  //获取之前保存的蓝牙信息
  /* param:{ deviceType: 品类码 }
       result:{status：0, //0: 执行成功, 1:执行失败, name:"xxx", deviceKey:"xxxxx"}
    */
  getDeviceBlueInfo(params = {}) {
    return this.blueToothModuleWrapper('getDeviceBlueInfo', params)
  },
  unbindDevice(params) {
    let param = Object.assign(params, {
      operation: 'unbindDevice'
    })
    return this.commandInterfaceWrapper(param)
  },
  //根据蓝牙信息建立蓝牙连接
  /* param:{name:"xxx",
        deviceKey:"xxxxx",
        service:"uuid", //蓝牙服务特征，使用者根据设备信息传入
        writeCharacter:"uuid", //蓝牙写入通道特征，使用者根据设备信息传入
        readCharacter:"uuid" //蓝牙读取通道特征，使用者根据设备信息传入
    } */
  /* 当收到蓝牙数据，app -> 插件:
    receiveMessageFromApp({ messageType: "receiveBlueInfo", messageBody: { deviceKey:"xxxxx", data: "xxx" } })
    */
  setupBlueConnection(params = {}) {
    return this.blueToothModuleWrapper('setupBlueConnection', params)
  },
  // 向蓝牙设备传输数据
  /* param:{
        deviceKey:"xxxxx",
        data:"xxx"
    } */
  writeBlueInfo(params = {}) {
    return this.blueToothModuleWrapper('writeBlueInfo', params)
  },
  //断开当前蓝牙连接
  /* 若是蓝牙意外断开, app -> 插件:
       receiveMessageFromApp({ messageType: "blueConnectionBreak", messageBody: {} })
    */
  disconnectBlueConnection(params = {}) {
    return this.blueToothModuleWrapper('disconnectBlueConnection', params)
  },
  //**********蓝牙接口***************END

  //**********蓝牙MESH接口***************START
  blueToothMeshModuleWrapper(apiName, param) {
    return new Promise((resolve, reject) => {
      blueToothMeshModule[apiName](
        JSON.stringify(param),
        resData => {
          resolve(this.convertToJson(resData))
        },
        error => {
          reject(error)
        }
      )
    })
  },
  //根据蓝牙信息建立蓝牙连接
  /* param:{
        mac:"xxx", //设备mac地址，可通getDeviceBlueMeshInfo接口获取
        ssid:"xxxxx", //设备ssid，可通getDeviceBlueMeshInfo接口获取
    } */
  /* 当收到蓝牙数据，app -> 插件:
    receiveMessageFromApp({ messageType: "receiveBlueInfo", messageBody: { deviceKey:"xxxxx", data: "xxx" } })
    */
  setupBlueMeshConnection(params = {}) {
    return this.blueToothMeshModuleWrapper('setupBlueMeshConnection', params)
  },
  //断开当前蓝牙连接
  /* 若是蓝牙意外断开, app -> 插件:
       receiveMessageFromApp({ messageType: "blueConnectionBreak", messageBody: {} })
    */
  disconnectBlueMeshConnection(params = {}) {
    return this.blueToothMeshModuleWrapper('disconnectBlueMeshConnection', params)
  },
  //获取当前家庭的所有Mesh设备的信息
  /* param:{ deviceType: 品类码 }
       result:{status：0, //0: 执行成功, 1:执行失败, name:"xxx", deviceKey:"xxxxx"}
    */
  getDeviceBlueMeshListInfo(params = {}) {
    return this.blueToothModuleWrapper('getDeviceBlueMeshListInfo', params)
  },
  // 向蓝牙Mesh发送控制指令
  /* param:{
        destAddress: xxx  //目标控制地址  ，可为 单播地址，群播地址
        name:xxx //例如 GenericOnOff 、GenericLevel 、LightCtlTemperature
        params :{     // name字段的不同，params需要不同的数据，例如  ,
        onoff:  xxx // 0 或1 ,name 为 GenericOnOff 需要  0或者1
        level:    xxx // GenericLevel 需要 0~100 之类的数值
        temperature:  xxxx //  LightCtlTemperature 才会需要的温度数值
        deltaUV: xxxx // LightCtlTemperature 才会需要
    } */
  sendBlueMeshControlMessage(params = {}) {
    return this.blueToothModuleWrapper('sendBlueMeshControlMessage', params)
  },
  // 蓝牙Mesh增加群订阅
  /*  ps1:一个mesh node element 可以订阅多个群地址
        ps2:一个群地址可以配置多个modelNumberId，以响应不同的控制消息
    param:{
        groupAddress:xxx  // 组播地址  这个理论上是 事业部应用服务器从 iot服务器上申请分配，建议从0xD000开始分配
        deviceAddress: xxx  //mesh node 的 element 单播地址
        modelNumberId:xxx // 控制模式的id , 例如  GenericOnOff 组播，需要传入 0x1000 ,之后就可以通过 sendBlueMeshControlMessage {name : “GenericOnOff”  群控制设备开关 }
    } */
  addBlueMeshModelSubscription(params = {}) {
    return this.blueToothModuleWrapper('addBlueMeshModelSubscription', params)
  },
  // 蓝牙Mesh取消群订阅
  /* param:{
        groupAddress:xxx  // 组播地址  这个理论上是 事业部应用服务器从 iot服务器上申请分配，建议从0xD000开始分配
        deviceAddress: xxx  //mesh node 的 element 单播地址
        modelNumberId:xxx // 控制模式的id , 例如  GenericOnOff 组播，需要传入 0x1000 ,之后就可以通过 sendBlueMeshControlMessage {name : “GenericOnOff”  群控制设备开关 }
    } */
  deleteBlueMeshModelSubscription(params = {}) {
    return this.blueToothModuleWrapper('deleteBlueMeshModelSubscription', params)
  }
  //**********蓝牙接口***************END
}
