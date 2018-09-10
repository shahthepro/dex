import Vue from 'vue'
import Router from 'vue-router'
import About from '@/views/About.vue';
import Trade from '@/views/Trade.vue';
import TOKENS from '@/core/tokens';

Vue.use(Router)

export default new Router({
  mode: 'history',
  base: process.env.BASE_URL,
  routes: [
    {
      path: '/',
      name: 'home',
      beforeEnter (to, from, next) {
        next({
          name: 'trade',
          params: TOKENS.defaultPair
        })
      }
    },
    {
      path: '/trade/:token/:base',
      name: 'trade',
      component: Trade,
      beforeEnter (to, from, next) {
        if (TOKENS.isPairValid(to.params.token, to.params.base)) {
          next()
        } else if (TOKENS.isPairValid(to.params.base, to.params.token)) {
          next({
            name: 'trade',
            params: {
              base: to.params.token,
              token: to.params.base
            }
          })
        } else {
          next('/404')
        }
      }
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
