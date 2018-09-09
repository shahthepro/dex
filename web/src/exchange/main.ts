import Vue from 'vue'
import App from '@/exchange/App.vue'
import router from '@/exchange/router'
import '@/plugins/vuetify.exchange'
import store from '@/store'
import TOKENS from '@/core/tokens'
// import Web3 from 'web3'

// Web3.givenProvider

Vue.config.productionTip = false

TOKENS.load().then(_ => {
  new Vue({
    router,
    store,
    render: h => h(App)
  }).$mount('#app')
})

// let p1 = fetch('/tokens.json')
//   .then(resp => resp.json())
//   .then(tokens => {
//     window[TOKENS] = tokens.map(token => {
//       return {
//         symbol: token.s,
//         address: token.a,
//         decimal: token.d
//       }
//     })
//   })

// p1
//   .then(_ => {
//     new Vue({
//       router,
//       store,
//       render: h => h(App)
//     }).$mount('#app')
//   })
