<template>
  <v-container fluid>
    <h2 class="page-subtitle">Trade history</h2>
  </v-container>
</template>

<script lang="ts">
// import store from '@/store'
// import { ALL_OPEN_ORDERS_NAMESPACE } from '@/core/constants'
// import ALL_PAIR_OPEN_ORDERS_MODULE from '@/store/modules/user-orders/user-orders'
// import { FETCH_ALL_OPEN_ORDERS, REMOVE_ORDER_FROM_ALL_OPEN_ORDERS } from '@/store/action-types'

// import Orderbook from '@/utils/orderbook'

// if (!store.state[ALL_OPEN_ORDERS_NAMESPACE]) {
//   store.registerModule(ALL_OPEN_ORDERS_NAMESPACE, ALL_PAIR_OPEN_ORDERS_MODULE)
// }

// function updateUserTrades() {
//     let walletAddress = (store.getters.wallet.isConnected) ? store.getters.wallet.current.address : null
//     store.dispatch(FETCH_ALL_OPEN_ORDERS, {
//       walletAddress
//     })
// }

export default {
  name: 'UserTrades',
//   components: {},
//   data () {
//     return {
//       isLoading: {},
//       lastTxError: '',
//     }
//   },
//   computed: {
//     // orders: {
//     //   get () {
//     //     return store.getters.allOpenOrders;
//     //   }
//     // },
//     wallet: {
//       get () {
//         return store.getters.wallet.current;
//       }
//     },
//     walletIsConnected: {
//       get () {
//         return store.getters.wallet.isConnected;
//       }
//     },
//   },
//   // methods: {},
//   // watch: {
//   //   wallet (newWallet) {
//   //     updateUserTrades()
//   //   }
//   // },
//   // beforeRouteEnter (to, from, next) {
//   //   updateUserTrades()
//   //   next()
//   // },
//   // beforeRouteUpdate (to, from, next) {
//   //   updateUserTrades()
//   //   next()
//   // },
}
</script>

<style lang="scss" scoped>
  .page-subtitle {
    margin-bottom: 20px
  }
</style>