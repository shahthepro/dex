<template>
    <v-container>
        <v-layout row wrap class="cb-grid">
            <v-flex xs12 sm12 md6>
                <h1>Choose a wallet</h1>
                <UnlockWallet />
            </v-flex>
            <v-flex xs12 sm12 md6>
                <h1>... and withdraw tokens</h1>
                <ApprovedWithdrawls :withdraw-requests="withdrawRequests" v-on:withdrawProcessed="onWithdrawProcessed" />
            </v-flex>
        </v-layout>
    </v-container>
</template>

<script lang="ts">
import ApprovedWithdrawls from '@/components/ApprovedWithdrawls.vue';
import UnlockWallet from '@/components/UnlockWallet.vue';
import store from '@/store'
import { WITHDRAW_REQUESTS_NAMESPACE } from '@/core/constants'
import WITHDRAW_REQUESTS_MODULES from '@/store/modules/withdraw-requests/withdraw-requests'
import { FETCH_WITHDRAW_REQUESTS } from '@/store/action-types'

if (!store.state[WITHDRAW_REQUESTS_NAMESPACE]) {
  store.registerModule(WITHDRAW_REQUESTS_NAMESPACE, WITHDRAW_REQUESTS_MODULES)
}

function updateWithdrawRequests() {
    let walletAddress = null
    if (store.getters.wallet.isConnected) {
        walletAddress = store.getters.wallet.current.address 
    }
    store.dispatch(FETCH_WITHDRAW_REQUESTS, { walletAddress })
}

export default {
  name: 'Trade',
  components: {
    ApprovedWithdrawls,
    UnlockWallet
  },
  data () {
    return {
    }
  },
  computed: {
    pairInfo () {
      return store.getters.pairInfo
    },
    wallet () {
      return store.getters.wallet.current
    },
    withdrawRequests: {
      get () {
        return store.getters.withdrawRequests
      }
    },
  },
  watch: {
    wallet (newWallet) {
      updateWithdrawRequests()
    }
  },
  beforeRouteEnter (to, from, next) {
    updateWithdrawRequests()
    next()
  },
  beforeRouteUpdate (to, from, next) {
    updateWithdrawRequests()
    next()
  },
  methods: {
    onWithdrawProcessed (txHash) {
    //   store.dispatch(REMOVE_ORDER_FROM_OPEN_ORDERS, { orderHash })
    },
  }
  
}
</script>

<style lang="scss" scoped>
    .cb-grid {
        & > .flex {
            padding: 12px;
        }
    }
    .container {
        padding-left: 0;
        padding-right: 0;
    }

    h1 {
        font-weight: 200;
        font-size: 2em;
        margin-bottom: 20px;
    }
</style>
