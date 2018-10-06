import Vue from 'vue'
import Router from 'vue-router'
import Home from '@/views/Home.vue'
import Deposit from '@/views/Deposit.vue'
import Withdraw from '@/views/Withdraw.vue'
import BridgeHelp from '@/views/BridgeHelp.vue'

Vue.use(Router)

let BASE_URL = process.env.BASE_URL

if (process.env.NODE_ENV == 'development') {
  BASE_URL = BASE_URL + 'bridge/'
}

export default new Router({
  mode: 'history',
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
