<template>
  <div class="app-wrapper">
    <dof-minibar
      title="插件"
      backgroundColor="transparent"
      textColor="#000000"
      :middle-text-style="headerStyle"
      @dofMinibarLeftButtonClicked="minibarLeftButtonClick"
      @dofMinibarRightButtonClicked="minibarRightButtonClick"
    >
      <div slot="left">
        <image :src="leftButton" style="height: 55px;width: 55px;transform:translateX(-10px);"></image>
      </div>
      <div slot="right" class="right-img-wrapper">
        <image :src="rightButton" style="height: 32px;width: 32px;"></image>
      </div>
    </dof-minibar>
    <div class="flex-column center margin-top-80">
      <dof-image src="/assets/image/logo.png" width="150px" height="150px"></dof-image>
      <text class="h2">{{ title }}</text>
      <text class="h4 margin-top-40 margin-bottom-20">Midea 模版项目</text>
      <dof-button
        class="margin-top-80"
        text="快速查看"
        type="primary"
        size="big"
        @dofButtonClicked="jumpTo"
      ></dof-button>
    </div>
    <div class="footer">
      <text class="copyright">&copy;Midea IOT software</text>
    </div>
  </div>
</template>
<script>
import { DofMinibar, DofImage, DofButton } from 'dolphin-weex-ui'
import nativeService from 'src/service/nativeService'
const globalEvent = weex.requireModule('globalEvent')

module.exports = {
  components: {
    DofMinibar,
    DofButton,
    DofImage
  },
  data: () => ({
    title: 'Dolphin Weex',
    leftButton: './assets/image/header/back_black@2x.png',
    rightButton: './assets/image/header/refresh.png',
    headerStyle: {
      fontFamily: 'PingFangSC-Regular',
      fontWeight: '900',
      fontSize: '28px',
      letterSpacing: 0
    }
  }),
  methods: {
    jumpTo() {
      let url = 'welcome.js'
      this.$MID.route.push(url)
    },
    minibarRightButtonClick() {
      nativeService.reload()
    }
  },
  created() {},
  mounted() {}
}
</script>

<style scoped>
.footer {
  position: absolute;
  bottom: 10px;
  right: 20px;
}
.copyright {
  font-size: 20px;
  color: #464c5b;
}
.margin-top-80 {
  margin-top: 80px;
}
.margin-top-40 {
  margin-top: 40px;
}
.margin-bottom-20 {
  margin-bottom: 20px;
}
.flex-row {
  flex-direction: row;
}
.flex-column {
  flex-direction: column;
}
.center {
  justify-content: center;
  align-items: center;
}
.h1 {
  font-size: 80px;
  line-height: 120px;
  color: #464c5b;
}

.h2 {
  font-size: 60px;
  line-height: 100px;
  color: #464c5b;
}

.h3 {
  font-size: 45px;
  line-height: 60px;
  color: #464c5b;
}

.h4 {
  font-size: 32px;
  line-height: 45px;
  color: #464c5b;
}

.h5 {
  font-size: 28px;
  line-height: 40px;
  color: #464c5b;
}

.flex-column {
  flex-direction: column;
}
</style>
