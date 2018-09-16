import Vue from 'vue'
import App from '@/exchange/App.vue'
import router from '@/exchange/router'
import '@/plugins/vuetify.exchange'
import store from '@/store'
import TOKENS from '@/core/tokens'
import BLOCKCHAIN_INFO from '@/core/blockchain';
import VueVirtualScroller from 'vue-virtual-scroller'

Vue.config.productionTip = false
Vue.config.devtools = process.env.NODE_ENV == "development"
Vue.config.performance = process.env.NODE_ENV == "development"
Vue.use(VueVirtualScroller)

BLOCKCHAIN_INFO.isExchange = true;

Promise.all([TOKENS.load(), BLOCKCHAIN_INFO.load()])
  .then(_ => {
    new Vue({
      router,
      store,
      render: h => h(App)
    }).$mount('#app')
  })