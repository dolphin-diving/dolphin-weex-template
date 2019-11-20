<template>
  <div class="wrapper">
    <dof-minibar title="欢迎社区" backgroundColor="transparent" textColor="#404040"> </dof-minibar>
    <div class="show-welcome margin-top-80">
      <text> {{ welcome }}</text>
    </div>
    <div class="show-welcome word">
      <text> {{ word }}</text>
    </div>
    <div class="show-welcome margin-top-80">
      <text :style="{ paddingLeft: '30px' }">插件demo:下载sample 模版</text>
      <text>使用dolphin-weex-cli 脚手架的 </text>
      <text>$: dolphin c</text>
      <text>选择 sample</text>
    </div>
  </div>
</template>

<script>
import { DofCell2, DofMinibar } from 'dolphin-weex-ui'
export default {
  components: {
    DofMinibar
  },
  data() {
    return {
      welcome: 'Welcome to Dolphin Weex',
      word: 'it is time to develop plugins yourself'
    }
  },
  created() {},
  methods: {}
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
.margin-top-80 {
  margin-top: 80px;
}
</style>
