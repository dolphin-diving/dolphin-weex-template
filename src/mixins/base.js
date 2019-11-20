import nativeService from 'src/service/nativeService'
import debugUtil from 'src/util/debugUtil'
import { DofMinibar } from 'dolphin-weex-ui'

const appDataTemplate = {}
const bundleUrl = weex.config.bundleUrl
const match = /.*\/(T0x.*)\//g.exec(bundleUrl)
const plugin_name = match ? match[1] : 'common' //appConfig.plugin_name
const srcFileName = bundleUrl.substring(bundleUrl.lastIndexOf('/') + 1, bundleUrl.lastIndexOf('.js'))
const globalEvent = weex.requireModule('globalEvent')
const storage = weex.requireModule('storage')
const appDataChannel = new BroadcastChannel(plugin_name + 'appData')
const pushDataChannel = new BroadcastChannel(plugin_name + 'pushData')

Vue.config.errorHandler = function(err, vm, info) {
  console.error(err)
}

export default {
  components: {
    DofMinibar
  },
  data: () => ({
    title: '',
    isIos: weex.config.env.platform == 'iOS' ? true : false,
    srcFileName: srcFileName,
    pluginVersion: '1.0.0',
    pluginName: plugin_name,
    isMixinCreated: true,
    isNavigating: false,
    appDataKey: plugin_name + 'appData',
    appDataChannel: appDataChannel,
    pushKey: 'receiveMessage',
    pushDataChannel: pushDataChannel,
    appData: appDataTemplate
  }),
  computed: {
    pageHeight() {
      return (750 / weex.config.env.deviceWidth) * weex.config.env.deviceHeight
    },
    isImmersion: function() {
      let result = true
      if (weex.config.env.isImmersion == 'false') {
        result = false
      }
      return result
    },
    isipx() {
      return (
        weex &&
        (weex.config.env.deviceModel === 'iPhone10,3' ||
        weex.config.env.deviceModel === 'iPhone10,6' || //iphoneX
        weex.config.env.deviceModel === 'iPhone11,8' || //iPhone XR
        weex.config.env.deviceModel === 'iPhone11,2' || //iPhone XS
          weex.config.env.deviceModel === 'iPhone11,4' ||
          weex.config.env.deviceModel === 'iPhone11,6') //iPhone XS Max
      )
    }
  },
  created() {
    console.log('created')
    //若isMixinCreated为false, 则不继承
    if (!this.isMixinCreated) return
    //Debug Log相关信息
    debugUtil.isEnableDebugInfo = false //开启关闭debuglog功能
    debugUtil.debugLog('@@@@@@ ' + this.title + '(' + plugin_name + '-' + srcFileName + ') @@@@@@')
    //监听全局推送(native->weex)
    globalEvent.addEventListener(this.pushKey, data => {
      debugUtil.debugLog(this.title + '=>' + this.pushKey + ': ' + data)
      //触发本页面处理事件
      this.handleNotification(data || {})
      //触发其他页面处理事件
      pushDataChannel.postMessage(data)
    })
    //监听全局推送通信渠道(weex->weex)
    pushDataChannel.onmessage = event => {
      this.handleNotification(event.data || {})
    }
    //监听全局应用数据通信渠道(weex->weex)
    appDataChannel.onmessage = event => {
      this.appData = event.data || {}
    }
    //页面创建时获取全局应用数据
    this.getAppData().then(data => {
      this.appData = data || {}
    })
  },
  methods: {
    viewappear() {},
    viewdisappear() {
      debugUtil.resetDebugLog()
    },
    getParameterByName: function(name) {
      let url = this.$getConfig().bundleUrl
      name = name.replace(/[\[\]]/g, '\\$&')
      var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
        results = regex.exec(url)
      if (!results) return null
      if (!results[2]) return ''
      return decodeURIComponent(results[2].replace(/\+/g, ' '))
    },
    goTo(pageName, options = {}, params) {
      if (!this.isNavigating) {
        this.isNavigating = true
        // 离开时同步全局应用数据
        nativeService.setItem(this.appDataKey, this.appData, () => {
          //跳转页面
          var path = pageName + '.js'
          if (params) {
            path +=
              '?' +
              Object.keys(params)
                .map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k]))
                .join('&')
          }
          options.viewTag = pageName
          nativeService.goTo(path, options)
          setTimeout(() => {
            this.isNavigating = false
          }, 500)
        })
      }
    },
    back() {
      //返回上一页
      nativeService.goBack()
    },
    exit() {
      nativeService.backToNative()
    },
    getAppData() {
      //获取全局应用数据
      return new Promise((resolve, reject) => {
        nativeService.getItem(this.appDataKey, resp => {
          let data
          if (resp.result == 'success') {
            data = resp.data
            if (typeof data == 'string') {
              try {
                data = JSON.parse(data)
              } catch (error) {}
            }
          }
          if (!data) {
            data = this.appData
          }
          resolve(data)
        })
      })
    },
    updateAppData(data) {
      //更新全局应用数据
      this.appData = Object.assign(this.appData, data)
      appDataChannel.postMessage(this.appData)
    },
    resetAppData() {
      //重置全局应用数据
      return new Promise((resolve, reject) => {
        nativeService.removeItem(this.appDataKey, resp => {
          this.appData = JSON.parse(JSON.stringify(appDataTemplate))
          appDataChannel.postMessage(this.appData)
          resolve()
        })
      })
    },
    handleNotification(data) {
      //处理推送消息
      debugUtil.debugLog(srcFileName, this.pushKey, data)
    },
    reload() {
      nativeService.reload()
    }
  }
}
