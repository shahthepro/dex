import Vue from 'vue'
import Router from 'vue-router'
import Home from '@/views/Home.vue'
import About from '@/views/About.vue';
import Trade from '@/views/Trade.vue';

Vue.use(Router)

export default new Router({
  mode: 'history',
  base: process.env.BASE_URL,
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home
    },
    {
      path: '/trade/:token/:base',
      name: 'trade',
      component: Trade
    },
    {
      path: '/orders',
      name: 'orders',
      component: About
    },
    {
      path: '/balances',
      name: 'balances',
      component: About
    },
    {
      path: '/help',
      name: 'help',
      component: About
    }
  ]
})
