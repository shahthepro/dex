<template>
  <v-flex>
    <v-card>
      <v-list>
        <v-list-tile v-for="request in withdrawRequests" :key="request.tx_hash">
          <v-list-tile-content>
            <v-list-tile-title>{{ `${request.amount} ${getTokenSymbol(request.token)}` }}</v-list-tile-title>
          </v-list-tile-content>

          <v-list-tile-action>
            <v-btn v-if="request.withdraw_status == 1" small flat outline @click="accept(request.tx_hash)" color="success">Accept</v-btn>
            <v-btn v-if="request.withdraw_status == 0" small flat outline color="success" :disabled="true">&nbsp;Signing...&nbsp;</v-btn>
          </v-list-tile-action>
        </v-list-tile>
      </v-list>
    </v-card>
    <v-dialog max-width="500" v-model="processWithdrawDialog" persistent>
      <v-card>
        <v-card-title class="headline" primary-title>Process your withdraw request</v-card-title>
        <v-card-text>Your withdraw request has enough signatures and ready to be processed.</v-card-text>
        <v-card-text>If you have already processed this withdraw request, please wait for the transaction to be mined before trying again.</v-card-text>
        <v-divider></v-divider>
        <v-card-text>
          <v-form ref="form" v-model="valid">
            <v-text-field v-model="gasPriceForProcessing" label="Gas Price" :suffix="`GWEI`" required :rules="[rules.number]"></v-text-field>
          </v-form>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" :disabled="!valid" :loading="loading" @click="process">Process Withdraw</v-btn>
          <v-spacer></v-spacer>
        </v-card-actions>
      </v-card>
    </v-dialog>
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
  </v-flex>
</template>

<script>
import FORM_RULES from '@/utils/form-rules'
import TOKENS from '@/core/tokens'
import Bridge from '@/utils/bridge'

export default {
  name: 'ApprovedWithdrawls',
  props: {
    withdrawRequests: Array
  },
  data() {
    return {
      snackbar: false,
      lastToastMessage: '',
      lastToastType: 'success',
      lastTxHash: '',
      loading: false,
      lastTxError: '',
      processWithdrawDialog: false,
      gasPriceForProcessing: null,
      rules: FORM_RULES,
      valid: null,
      txHashToProcess: null,
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
      this.txHashToProcess = txHash
      this.processWithdrawDialog = true
    },
    process() {
      let txHash = this.txHashToProcess
      this.snackbar = false
      
      this.loading = true
      Bridge.withdraw(txHash, this.gasPriceForProcessing)
        .then(receipt => {
          if (receipt.status == 1) {
            this.lastToastMessage = 'The transaction has been submitted to the blockchain. Check your balance after the transaction has been mined.'
            this.lastToastType = 'success'
          } else {
            this.lastToastMessage = 'Something went wrong, Have you already processed this withdraw request?'
            this.lastToastType = 'error'
          }
          this.processWithdrawDialog = false
        })
        .catch(err => {
          this.lastToastMessage = err.message
          this.lastToastType = 'error'
        })
        .then(_ => {
          this.loading = false
          this.txHashToProcess = null
          this.snackbar = true
        })
    }
  }
}
</script>

<style lang="scss" scoped>
</style>