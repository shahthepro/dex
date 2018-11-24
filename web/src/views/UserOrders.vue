<template>
  <v-container fluid>
    <h2 class="orders-title">Open orders</h2>
    <table v-if="walletIsConnected && orders.length > 0" class="v-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Market</th>
          <th>Type</th>
          <th>Price</th>
          <th>Amount</th>
          <th>Filled</th>
          <th>Total</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="order in orders">
          <td class="text-xs-left">{{ order.created_at }}</td>
          <td class="text-xs-left">{{order.token}}/{{ order.base }}</td>
          <td class="text-xs-left">{{ order.is_bid ? 'Buy' : 'Sell' }}</td>
          <td class="text-xs-right">{{ order.price }}</td>
          <td class="text-xs-right">{{ order.quantity }}</td>
          <td class="text-xs-right">{{ order.volume_filled }}</td>
          <td class="text-xs-right">{{ order.volume }}</td>
          <td class="text-xs-center"><v-btn small flat color="error" :loading="isLoading[order.order_hash]" @click="cancelOrder(order.order_hash)">Cancel</v-btn></td>
        </tr>
      </tbody>
    </table>
    <v-alert :value="walletIsConnected && orders.length == 0" outline type="info">
      You have no open orders at the moment.
    </v-alert>
    <v-alert :value="!walletIsConnected" outline type="info">
      Please unlock your wallet to see your open orders.
    </v-alert>
  </v-container>
</template>

<script lang="ts">
import store from '@/store'
import { ALL_OPEN_ORDERS_NAMESPACE } from '@/core/constants'
import ALL_PAIR_OPEN_ORDERS_MODULE from '@/store/modules/user-orders/user-orders'
import { FETCH_ALL_OPEN_ORDERS } from '@/store/action-types'

import Orderbook from '@/utils/orderbook'

if (!store.state[ALL_OPEN_ORDERS_NAMESPACE]) {
  store.registerModule(ALL_OPEN_ORDERS_NAMESPACE, ALL_PAIR_OPEN_ORDERS_MODULE)
}

function updateOpenOrders() {
    let walletAddress = (store.getters.wallet.isConnected) ? store.getters.wallet.current.address : null
    store.dispatch(FETCH_ALL_OPEN_ORDERS, {
      walletAddress
    })
}

export default {
  name: 'UserOrders',
  components: {
  },
  data () {
    return {
      isLoading: {},
      lastTxError: '',
    }
  },
  computed: {
    orders: {
      get () {
        return store.getters.allOpenOrders;
      }
    },
    wallet: {
      get () {
        return store.getters.wallet.current;
      }
    },
    walletIsConnected: {
      get () {
        return store.getters.wallet.isConnected;
      }
    },
  },
  methods: {
    cancelOrder (orderHash) {
      this.$set(this.isLoading, orderHash, true)
      Orderbook.cancelOrder(orderHash)
        .then(receipt => {
          if (receipt.status == 1) {
            // remove hash from data
            console.log('Cancelled order')
            this.$store.dispatch(REMOVE_ORDER_FROM_OPEN_ORDERS, { orderHash })
          } else {
            this.lastTxError = `Something went wrong, Do you have sufficient funds?`
            console.log('Does the order exists? Are you owner?')
          }
        })
        .catch(err => {
          this.lastTxError = err.message
          console.log(err.message)
        })
        .then(_ => {
          delete this.isLoading[orderHash]
        })
    },
  },
  watch: {
    wallet (newWallet) {
      updateOpenOrders()
    }
  },
  beforeRouteEnter (to, from, next) {
    updateOpenOrders()
    next()
  },
  beforeRouteUpdate (to, from, next) {
    updateOpenOrders()
    next()
  },
}
</script>

<style lang="scss" scoped>
  .orders-title {
    margin-bottom: 20px
  }
</style>