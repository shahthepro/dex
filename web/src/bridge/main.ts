import Vue from 'vue'
import App from '@/bridge/App.vue'
import router from '@/bridge/router'
import '@/plugins/vuetify.bridge'
import Web3 from 'web3'

Web3.givenProvider

Vue.config.productionTip = false

new Vue({
  router,
  render: h => h(App)
}).$mount('#bridge')
