<template>
  <div class="about">
    <h1>User's open orders</h1>
  </div>
</template>

<script lang="ts">
import store from '@/store'
import { ALL_OPEN_ORDERS_NAMESPACE } from '@/core/constants'
import ALL_PAIR_OPEN_ORDERS_MODULE from '@/store/modules/user-orders/user-orders'
import { SET_TOKEN_PAIR, FETCH_USER_PAIR_ORDERS } from '@/store/action-types'

if (!store.state[ALL_OPEN_ORDERS_NAMESPACE]) {
  store.registerModule(ALL_OPEN_ORDERS_NAMESPACE, ALL_PAIR_OPEN_ORDERS_MODULE)
}

export default {
  name: 'Trade',
  components: {
  },
}
</script>