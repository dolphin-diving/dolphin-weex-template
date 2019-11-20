import { baseURL, ENV } from 'src/util/config.js'
const modal = weex.requireModule('modal')
const animation = weex.requireModule('animation')
const navigator = weex.requireModule('navigator')
const navigatorEx = weex.requireModule('navigatorEx')
const stream = weex.requireModule('stream')
const meta = weex.requireModule('meta')

function getContextPath() {
  let url = weex.config.bundleUrl
  if (url.indexOf('?') > 0) {
    url = url.substring(0, url.indexOf('?'))
  }
  url = url
    .split('/')
    .slice(0, -1)
    .join('/')
  return url
}
const global = {
  install: function(Vue, option) {
    Vue.$MID = {}
    Vue.prototype.$MID = Vue.$MID
    let MID = Vue.prototype.$MID
    MID.Vue = Vue

    MID.Env = {
      baseURL: baseURL,
      envCode: ENV
    }
    MID.Util = {
      greet: function(param) {
        let message = param ? param : 'hello, nick'
        console.log(message)
        modal.toast({
          message: message,
          duration: 1
        })
      }
    }
    MID.route = {
      push: function(url, params, callback) {
        let paramsStr = ''
        if (params) {
          for (let key in params) {
            paramsStr += key + '=' + encodeURIComponent(params[key]) + '&'
          }
        }
        if (url.indexOf('?') < 0 && paramsStr != '') {
          url += '?'
        }
        url += paramsStr
        //link平台中使用navigatorEx,playground中使用navigator
        try {
          if (url.indexOf('http') == 0 || url.indexOf('file') == 0) navigatorEx.push(url)
          else {
            url = getContextPath() + '/' + url
            navigatorEx.push(url)
          }
        } catch (ex) {
          if (url.indexOf('http') == 0 || url.indexOf('file') == 0) {
            navigator.push(
              {
                url: url,
                animated: 'true'
              },
              callback
            )
          } else {
            url = getContextPath() + '/' + url
            let message = url
            console.log(message)
            modal.toast({
              message: message,
              duration: 1
            })
            navigator.push(
              {
                url: url,
                animated: 'true'
              },
              callback
            )
          }
        }
      },
      pop: function() {
        // let message = 'message: route pop'
        // modal.toast({
        //   message: message,
        //   duration: 1
        // })
        navigator.pop()
      }
    }

    MID.getContextPath = function() {
      let url = weex.config.bundleUrl
      if (url.indexOf('?') > 0) {
        url = url.substring(0, url.indexOf('?'))
      }
      url = url
        .split('/')
        .slice(0, -1)
        .join('/')
      return url
    }

    MID.toast = function(message, duration = 1) {
      modal.toast({
        message,
        duration
      })
    }

    MID.alert = function(msg, callback, option) {
      let okTitle = '确定'
      if (option) {
        if (option.okTitle) okTitle = option.okTitle
      }
      if (typeof msg !== 'string') {
        msg = JSON.stringify(msg)
      }
      modal.alert(
        {
          message: msg || '',
          duration: 1,
          okTitle: okTitle
        },
        value => {
          callback && callback(value)
        }
      )
    }

    /**
     * 弹出确认框
     * @param msg {string} 提示文本
     * @param callback {function} 点击确定/取消后回调函数
     * @param option {object} 参数
     * @param option.okTitle {string} 确定按钮文本
     * @param option.cancelTitle {string} 取消按钮文本
     */
    MID.confirm = function(msg, callback, option) {
      let okTitle = '确定',
        cancelTitle = '取消'
      if (option) {
        if (option.okTitle) okTitle = option.okTitle
        if (option.cancelTitle) cancelTitle = option.cancelTitle
      }
      modal.confirm(
        {
          message: msg || '',
          duration: 0.4,
          okTitle: okTitle,
          cancelTitle: cancelTitle
        },
        value => {
          callback && callback(value)
        }
      )
    }

    /**
     * 显示一个组件（可设置动画）
     * @param params
     * @param callback
     */
    MID.show = function(params, callback) {
      let el = params.id
      if (!el) {
        return
      }
      let duration = params.duration
      let transform = params.transform || 'translate(0, 0)'
      let transformOrigin = params.transformOrigin || 'center center'
      let timingFunction = params.timingFunction || 'ease'

      animation.transition(
        el,
        {
          styles: {
            opacity: '1',
            transform: transform,
            transformOrigin: transformOrigin
          },
          duration: duration || 0,
          timingFunction: timingFunction,
          delay: 0
        },
        () => {
          callback && callback()
        }
      )
    }

    /**
     * 隐藏一个组件(可设置动画)
     * @param params
     * @param callback
     */
    MID.hide = function(params, callback) {
      let el = params.id
      if (!el) {
        return
      }
      let duration = params.duration
      let transform = params.transform || 'translate(0, 0)'
      let transformOrigin = params.transformOrigin || 'center center'
      let timingFunction = params.timingFunction || 'ease'
      animation.transition(
        el,
        {
          styles: {
            opacity: '0',
            transform: transform,
            transformOrigin: transformOrigin
          },
          duration: duration || 0,
          timingFunction: timingFunction,
          delay: 0
        },
        () => {
          callback && callback()
        }
      )
    }

    //接口变量
    MID.Env = {
      baseURL: baseURL,
      envCode: ENV
    }
    let plateform = weex.config.env.platform.toLowerCase()
    MID.platform = {
      name: plateform
    }
    //web 绑定$MID, 方便调试查看全局方法
    if (plateform === 'web') {
      window.$MID = MID
    }
  }
}

export default global
