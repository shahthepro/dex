import Vue from 'vue'
import Router from 'vue-router'
import Home from '@/views/Home.vue'
import Deposit from '@/views/Deposit.vue'
import Withdraw from '@/views/Withdraw.vue'
import BridgeHelp from '@/views/BridgeHelp.vue'

Vue.use(Router)

console.log()

export default new Router({
  mode: 'history',
  base: process.env.BASE_URL + 'bridge' + '/',
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
