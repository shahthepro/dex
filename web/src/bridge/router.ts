import Vue from 'vue'
import Router, { RouterMode } from 'vue-router'
import Home from '@/views/Home.vue'
import Deposit from '@/views/Deposit.vue'
import Withdraw from '@/views/Withdraw.vue'
import BridgeHelp from '@/views/BridgeHelp.vue'

Vue.use(Router)

let BASE_URL = process.env.BASE_URL
let MODE: RouterMode = 'history'

if (process.env.NODE_ENV == 'development') {
  BASE_URL = BASE_URL + 'bridge/'
  MODE = 'hash'
}

export default new Router({
  mode: MODE,
  base: BASE_URL,
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home
    },
    {
      path: '/deposit',
      name: 'deposit',
      component: Deposit
    },
    {
      path: '/withdraw',
      name: 'withdraw',
      component: Withdraw
    },
    {
      path: '/help',
      name: 'help',
      component: BridgeHelp
    }
  ]
})
