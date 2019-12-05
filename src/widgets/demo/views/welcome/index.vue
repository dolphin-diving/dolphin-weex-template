<template>
  <div class="wrapper">
    <dof-minibar
      title="欢迎页"
      backgroundColor="transparent"
      textColor="#404040"
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
    <div class="lottie-wrapper">
      <div class="show-welcome margin-top-40 margin-bottom-40">
        <text> {{ welcome }}</text>
      </div>
      <div class="text-wrapper" v-if="!isLottieShow">
        <div class="show-welcome word">
          <text> {{ word }}</text>
        </div>
      </div>
      <midea-lottie-view
        v-if="isLottieShow"
        ref="lottieView"
        class="lottie"
        :data="lottieData"
        :loop="true"
      ></midea-lottie-view>
      <div class="logo">
        <text class="logo-text">DolphinWeex</text>
      </div>
    </div>
    <div class="show-welcome margin-top-40">
      <text class="tip-text" :style="{ paddingLeft: '30px' }">插件demo:下载sample 模版</text>
      <text class="tip-text">使用dolphin-weex-cli 脚手架的 </text>
      <text class="tip-text">$: dolphin c</text>
      <text class="tip-text">选择 sample</text>
    </div>
  </div>
</template>

<script>
import { DofCell2, DofMinibar } from 'dolphin-weex-ui'
const lottieModule = weex.requireModule('lottieModule')
import circle from '../../assets/lottie/circle.json'
import egg from '../../assets/lottie/color-egg.json'
import nativeService from 'src/service/nativeService'

export default {
  components: {
    DofMinibar
  },
  data() {
    return {
      leftButton: './assets/image/header/back_black@2x.png',
      rightButton: './assets/image/header/refresh.png',
      word: 'it is time to develop plugins yourself',
      lottieData: '',
      isLottieShow: false
    }
  },
  created() {},
  mounted() {
    this.lottieData = JSON.stringify(circle)
    setTimeout(() => {
      this.isLottieShow = true
    }, 1200)
  },
  computed: {
    welcome() {
      return this.isLottieShow ? 'Welcome to' : 'Welcome to DolphinWeex'
    }
  },
  methods: {
    minibarRightButtonClick() {
      nativeService.reload()
    }
  }
}
</script>
<style scoped>
.show-welcome {
  padding-top: 15px;
  padding-bottom: 15px;
  padding-left: 50px;
}
.word {
  justify-content: flex-end;
  align-items: flex-end;
  padding-right: 50px;
}
.margin-top-40 {
  margin-top: 40px;
}
.margin-bottom-40 {
  margin-bottom: 40px;
}
.lottie-wrapper {
  width: 750px;
  height: 700px;
  position: relative;
}
.lottie {
  width: 750px;
  height: 550px;
}
.logo {
  position: absolute;
  top: 385px;
  left: 375px;
  transform: translateX(-50%);
}
.logo-text {
  color: #0092d7;
  font-size: 50px;
}
.tip-text {
  color: #9a9a9a;
}
</style>
