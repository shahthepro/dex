<template>
  <v-layout fill-height>
    <table class="v-table" v-show="walletIsConnected && orders.length > 0">
      <thead>
        <tr>
          <th>Date</th>
          <th v-if="showMarket">Market</th>
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
          <td class="text-xs-left" v-if="showMarket">{{ getMarketDisplayName(order) }}</td>
          <td class="text-xs-left">{{ order.is_bid ? 'Buy' : 'Sell' }}</td>
          <td class="text-xs-right">{{ order.price }}</td>
          <td class="text-xs-right">{{ order.quantity }}</td>
          <td class="text-xs-right">{{ order.volume_filled }}</td>
          <td class="text-xs-right">{{ order.volume }}</td>
          <td class="text-xs-center"><v-btn small flat color="error" :loading="isLoading[order.order_hash]" @click="cancelOrder(order.order_hash)">Cancel</v-btn></td>
        </tr>
      </tbody>
    </table>
    <div class="alert-boxes">
      <v-alert :value="walletIsConnected && orders.length == 0" outline type="info">
        You have no open orders at the moment.
      </v-alert>
      <v-alert :value="!walletIsConnected" outline type="info">
        Please unlock your wallet to see your open orders.
      </v-alert>
    </div>
    <v-snackbar
      v-model="snackbar"
      :multi-line="true"
      :timeout="lastToastType == 'error' ? 0 : 3500"
      :top="true"
      :color="lastToastType"
    >
      {{ lastToastMessage }}
      <v-btn
        color="white"
        flat
        @click="snackbar = false"
      >
        Close
      </v-btn>
    </v-snackbar>
  </v-layout>
</template>

<script>
import { REMOVE_ORDER_FROM_OPEN_ORDERS } from '@/store/action-types'

import Orderbook from '@/utils/orderbook'
import TOKENS from '@/core/tokens'

export default {
  name: 'OpenOrders',
  props: {
    showMarket: Boolean,
    orders: Array,
  },
  data () {
    return {
      isLoading: {},
      snackbar: false,
      lastToastMessage: '',
      lastToastType: 'success',
    }
  },
  computed: {
    // openOrders: {
    //   get () {
    //     return this.$store.getters.openOrders.data
    //   }
    // },
    walletIsConnected: {
      get () {
        return this.$store.getters.wallet.isConnected
      }
    },
  },
  methods: {
    getMarketDisplayName (order) {
      let base = TOKENS.getByAddress(order.base).symbol
      let token = TOKENS.getByAddress(order.token).symbol
      return `${token}/${base}`
    },
    cancelOrder (orderHash) {
      this.snackbar = false
      this.$set(this.isLoading, orderHash, true)
      Orderbook.cancelOrder(orderHash)
        .then(receipt => {
          if (receipt.status == 1) {
            this.lastToastMessage = `Order ${orderHash.slice(0, 7)}...${orderHash.slice(orderHash.length - 5)} has been cancelled`
            this.lastToastType = 'success'
            this.$emit('order-cancelled', orderHash)
          } else {
            this.lastToastMessage = `Something went wrong, Does the order exists? Are you owner?`
            this.lastToastType = 'error'
          }
        })
        .catch(err => {
          this.lastToastMessage = err.message
          this.lastToastType = 'error'
        })
        .then(_ => {
          delete this.isLoading[orderHash]
          this.snackbar = true
        })
    }
  }
}
</script>

<style lang="scss" scoped>
table.v-table thead td:not(:nth-child(1)), table.v-table tbody td:not(:nth-child(1)), table.v-table thead th:not(:nth-child(1)), table.v-table tbody th:not(:nth-child(1)), table.v-table thead td:first-child, table.v-table tbody td:first-child, table.v-table thead th:first-child, table.v-table tbody th:first-child {
  padding: 0 5px;
}
.v-table tr {
  max-width: 100%;
}
.v-table tr td {
  white-space: nowrap;
}
table.v-table thead tr, table.v-table tbody tr td {
  height: 40px;
}
.alert-boxes {
  padding: 20px;
  width: 100%;
  max-height: 50px;
}
</style>
