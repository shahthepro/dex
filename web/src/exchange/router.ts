import Vue from 'vue'
import Router from 'vue-router'
import ExchangeHelp from '@/views/ExchangeHelp.vue'
import Trade from '@/views/Trade.vue'
import UserOrders from '@/views/UserOrders.vue'
import UserTrades from '@/views/UserTrades.vue'
import WalletBalances from '@/views/WalletBalances.vue'
import PendingFunds from '@/views/PendingFunds.vue'
import TOKENS from '@/core/tokens'

Vue.use(Router)

let router = new Router({
  mode: 'history',
  base: process.env.BASE_URL,
  routes: [
    {
      path: '/',
      name: 'home',
      meta: {
        title: _ => 'KirukkuDEX'
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
        title: route => `${route.params.token}/${route.params.base}`
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
          // next('/404')
        }
      }
    },
    {
      path: '/orders',
      name: 'orders',
      component: UserOrders,
      meta: {
        title: _ => 'My Open Orders'
      }
    },
    {
      path: '/user-trades',
      name: 'user-trades',
      component: UserTrades,
      meta: {
        title: _ => 'My Trade History'
      }
    },
    {
      path: '/balances',
      name: 'balances',
      component: WalletBalances,
      meta: {
        title: _ => 'Balances'
      }
    },
    {
      path: '/balances/pending',
      name: 'pending-balances',
      component: PendingFunds,
      meta: {
        title: _ => 'Pending Deposits and Withdrawals'
      }
    },
    {
      path: '/help',
      name: 'help',
      component: ExchangeHelp,
      meta: {
        title: _ => 'Help'
      }
    }
  ]
})

router.beforeEach((to, from, next) => {
  let SITE_NAME = 'KirukkuDEX'

  if (to.meta) {
    switch (typeof to.meta.title) {
      case 'function':
        document.title = `${to.meta.title(to)} - ${SITE_NAME}`
        break
        
      case 'string':
        document.title = `${to.meta.title} - ${SITE_NAME}`
        break

      default:
        document.title = SITE_NAME
        break
    }
  } else {
    document.title = SITE_NAME
  }

  next()
})

export default router