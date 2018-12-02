import Vue from 'vue'
import App from '@/bridge/App.vue'
import router from '@/bridge/router'
import '@/plugins/vuetify.bridge'
import store from '@/store'
import TOKENS from '@/core/tokens'
import BLOCKCHAIN_INFO from '@/core/blockchain'
import CONFIG from '@/core/config';

Vue.config.productionTip = false
Vue.config.devtools = process.env.NODE_ENV == "development"
Vue.config.performance = process.env.NODE_ENV == "development"

CONFIG.loadFromEnv(process.env)

Promise.all([TOKENS.load(), BLOCKCHAIN_INFO.load({ forExchange: false })])
  .then(_ => {
    new Vue({
      router,
      store,
      render: h => h(App)
    }).$mount('#bridge')
  })