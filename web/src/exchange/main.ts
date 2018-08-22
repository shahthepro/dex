import Vue from 'vue'
import App from '@/App.vue'
import router from '@/exchange/router'
import '@/plugins/vuetify'
import Web3 from 'web3'

Web3.givenProvider

Vue.config.productionTip = false

new Vue({
  router,
  render: h => h(App)
}).$mount('#app')
