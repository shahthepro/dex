import Vue from 'vue'
import Router from 'vue-router'
import About from '@/views/About.vue'
import Trade from '@/views/Trade.vue'
import TOKENS from '@/core/tokens'
import store from '@/store'

Vue.use(Router)

let router = new Router({
  mode: 'history',
  base: process.env.BASE_URL,
  routes: [
    {
      path: '/',
      name: 'home',
      meta: {
        title: _ => 'ChilraDEX'
      },
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
      meta: {
        title: route => `${route.params.token}/${route.params.base} - ChilraDEX`
      },
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
      component: About,
      meta: {
        title: _ => 'My Orders - ChilraDEX'
      }
    },
    {
      path: '/balances',
      name: 'balances',
      component: About,
      meta: {
        title: _ => 'Balances - ChilraDEX'
      }
    },
    {
      path: '/help',
      name: 'help',
      component: About,
      meta: {
        title: _ => 'Help - ChilraDEX'
      }
    }
  ]
})

router.beforeEach((to, from, next) => {
  document.title = to.meta.title(to)
  next()
})

export default router