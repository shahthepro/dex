import Vue from 'vue'
import App from '@/exchange/App.vue'
import router from '@/exchange/router'
import '@/plugins/vuetify.exchange'
import store from '@/exchange/store'
// import Web3 from 'web3'

// Web3.givenProvider

Vue.config.productionTip = false

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
