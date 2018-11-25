<template>
  <v-container>
    <h2 class="page-subtitle">Wallet Balances</h2>
    <BalanceList :token-balances="tokenBalances" />
  </v-container>
</template>

<script lang="ts">
import store from '@/store'
import { WALLET_BALANCES_NAMESPACE } from '@/core/constants'
import WALLET_BALANCES_MODULE from '@/store/modules/wallet-balances/wallet-balances'
import { FETCH_WALLET_BALANCES } from '@/store/action-types'

import BalanceList from '@/components/BalanceList.vue'

if (!store.state[WALLET_BALANCES_NAMESPACE]) {
  store.registerModule(WALLET_BALANCES_NAMESPACE, WALLET_BALANCES_MODULE)
}

function updateWalletBalances() {
    let walletAddress = (store.getters.wallet.isConnected) ? store.getters.wallet.current.address : null
    store.dispatch(FETCH_WALLET_BALANCES, {
      walletAddress
    })
}

export default {
  name: 'WalletBalances',
  components: {
    BalanceList
  },
  data () {
    return {
    }
  },
  computed: {
    tokenBalances: {
      get () {
        return store.getters.walletBalances;
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
  // methods: {},
  watch: {
    wallet (newWallet) {
      updateWalletBalances()
    }
  },
  beforeRouteEnter (to, from, next) {
    updateWalletBalances()
    next()
  },
  beforeRouteUpdate (to, from, next) {
    updateWalletBalances()
    next()
  },
}
</script>

<style lang="scss" scoped>
  .page-subtitle {
    margin-bottom: 20px
  }
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
</style>