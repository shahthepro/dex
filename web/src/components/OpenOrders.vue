<template>
  <v-layout>
    <table class="v-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Side</th>
          <th>Price</th>
          <th>Amount</th>
          <th>Filled</th>
          <th>Total</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="order in openOrders">
          <td class="text-xs-left">{{ order.created_at }}</td>
          <td class="text-xs-left">{{ order.is_bid ? 'Buy' : 'Sell' }}</td>
          <td class="text-xs-right">{{ order.price }}</td>
          <td class="text-xs-right">{{ order.quantity }}</td>
          <td class="text-xs-right">{{ order.volume_filled }}</td>
          <td class="text-xs-right">{{ order.volume }}</td>
          <td class="text-xs-center"><v-btn small flat color="error" :loading="isLoading[order.order_hash]" @click="cancelOrder(order.order_hash)">Cancel</v-btn></td>
        </tr>
      </tbody>
    </table>
  </v-layout>
</template>

<script>
import { REMOVE_ORDER_FROM_OPEN_ORDERS } from '@/store/action-types'

import Orderbook from '@/utils/orderbook'

export default {
  name: 'OpenOrders',
  data () {
    return {
      isLoading: {}
    }
  },
  computed: {
    openOrders: {
      get () {
        return this.$store.getters.openOrders.data
      }
    }
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
  font-size: 0.8rem;
}
table.v-table thead tr, table.v-table tbody tr td {
  height: 25px;
}
</style>
