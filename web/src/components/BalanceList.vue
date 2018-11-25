<template>
  <v-layout column wrap>
    <v-flex class="alert-boxes" v-show="walletIsConnected">
      <v-alert outline type="info" :value="true">
        Head over to <a href="https://bridge.chilra.com">Bridge</a> to load funds to your ChilraDEX Wallet.
      </v-alert>
      <v-flex class="text-xs-center">
        <v-btn href="https://bridge.chilra.com" large color="primary">Go to Bridge</v-btn>
      </v-flex>
    </v-flex>
    <v-flex class="alert-boxes" v-show="!walletIsConnected">
      <v-alert outline type="info" :value="true">
        Please unlock your wallet to see your balances.
      </v-alert>
    </v-flex>
    <div>
      <table class="v-table" v-show="walletIsConnected && tokenBalances.length > 0">
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Address</th>
            <th>Balance</th>
            <th>In Orders</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="tokenBalance in tokenBalances">
            <td class="text-xs-left">{{ getTokenSymbol(tokenBalance.token) }}</td>
            <td class="text-xs-left">{{ tokenBalance.token }}</td>
            <td class="text-xs-right">{{ tokenBalance.balance }}</td>
            <td class="text-xs-right">{{ tokenBalance.escrow }}</td>
            <td class="text-xs-center"><v-btn small flat color="success" @click="withdrawButtonClick(order.order_hash)">Request Withdraw</v-btn></td>
          </tr>
        </tbody>
      </table>
    </div>
  </v-layout>
</template>

<script>
import TOKENS from '@/core/tokens'

export default {
  name: 'BalanceList',
  props: {
    tokenBalances: Array,
  },
  computed: {
    walletIsConnected: {
      get () {
        return this.$store.getters.wallet.isConnected
      }
    },
  },
  methods: {
    getTokenSymbol (tokenAddress) {
      return TOKENS.getByAddress(tokenAddress).symbol
    },
    withdrawButtonClick (tokenAddress) {
        //
    },
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
    margin-bottom: 20px;
  }
</style>
