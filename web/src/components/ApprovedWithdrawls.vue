<template>
  <v-card>
    <v-list>
      <v-list-tile v-for="request in withdrawRequests" :key="request.tx_hash">
        <v-list-tile-content>
          <v-list-tile-title>{{ `${request.amount} ${getTokenSymbol(request.token)}` }}</v-list-tile-title>
        </v-list-tile-content>

        <v-list-tile-action>
          <v-btn small flat outline @click="accept(request.tx_hash)" color="success" :loading="loading">Accept</v-btn>
        </v-list-tile-action>
      </v-list-tile>
    </v-list>
  </v-card>
</template>

<script>
import TOKENS from '@/core/tokens'
import Bridge from '@/utils/bridge'

export default {
  name: 'ApprovedWithdrawls',
  props: {
    withdrawRequests: Array
  },
  data() {
    return {
      lastTxHash: '',
      loading: false,
      lastTxError: '',
    }
  },
  computed: {
    isWalletConnected() {
      return this.$store.state.isWalletConnected
    },
    wallet() {
      return this.$store.state.wallet
    },
    web3() {
      return this.$store.state.web3
    },
    tokens() {
      return this.$store.state.supportedTokens
    }
  },
  methods: {
    getTokenSymbol (tokenAddress) {
      return TOKENS.getByAddress(tokenAddress).symbol
    },
    accept(txHash) {
      this.loading = true
      this.lastTxError = '';
      this.lastTxHash = '';
      Bridge.withdraw(txHash, '0')
        .then(receipt => {
          if (receipt.status == 1) {
            this.lastTxHash = receipt.transactionHash
          } else {
            this.lastTxHash = receipt.transactionHash
            this.lastTxError = `Something went wrong, Have you already processed this withdraw request?`;
          }
        })
        .catch(err => {
          this.lastTxError = err.message
        })
        .then(_ => {
          this.loading = false
        })
    }
  }
}
</script>

<style lang="scss" scoped>
</style>