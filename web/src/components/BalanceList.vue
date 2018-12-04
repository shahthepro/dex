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
            <td class="text-xs-center"><v-btn small flat color="success" @click="withdrawButtonClick(tokenBalance.token, tokenBalance.balance)">Request Withdraw</v-btn></td>
          </tr>
        </tbody>
      </table>
    </div>

    <v-dialog max-width="500" v-model="withdrawTokenDialog" persistent>
      <v-card>
        <v-card-title class="headline" primary-title>Keep your keystore file safe</v-card-title>
        <v-card-text>
          <v-form v-if="withdrawTokenDialog" ref="valid" v-model="valid">
            <v-text-field v-model="amountToWithdraw" label="Amount" :suffix="this.tokenToWithdraw.symbol" required :rules="[rules.number]"></v-text-field>
          </v-form>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions>
          <v-btn :disabled="withdrawInProgress" flat @click="closeWithdrawDialog()">Close</v-btn>
          <v-spacer></v-spacer>
          <v-btn color="primary" :loading="withdrawInProgress" :disabled="!valid || amountToWithdraw <= 0" @click="confirmWithdraw()">Submit Withdraw Request</v-btn>
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
  </v-layout>
</template>

<script>
import FORM_RULES from '@/utils/form-rules'
import TOKENS from '@/core/tokens'
import DEXChain from '@/utils/dexchain'

export default {
  name: 'BalanceList',
  props: {
    tokenBalances: Array,
  },
  data () {
    return {
      snackbar: false,
      lastToastMessage: '',
      lastToastType: 'success',
      withdrawTokenDialog: false,
      tokenToWithdraw: null,
      amountToWithdraw: 0,
      withdrawInProgress: false,
      rules: FORM_RULES,
      valid: null
    }
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
    withdrawButtonClick (tokenAddress, tokenAvailable) {
      this.tokenToWithdraw = TOKENS.getByAddress(tokenAddress)
      if (this.tokenToWithdraw == null) {
        throw new Error("Invalid token")
      }
      this.amountToWithdraw = tokenAvailable
      this.withdrawTokenDialog = true
    },
    confirmWithdraw () {
      this.snackbar = false
      this.withdrawInProgress = true
      DEXChain.withdrawTokens(this.tokenToWithdraw.address, this.amountToWithdraw)
        .then(receipt => {
          this.withdrawInProgress = false
          if (receipt.status == 1) {
            this.lastToastMessage = 'Your withdraw request has been forwarded to Bridge and awaiting confirmatitons'
            this.lastToastType = 'success'
            this.$emit('withdraw-tokens', this.tokenToWithdraw.address)
            this.closeWithdrawDialog()
          } else {
            this.lastToastMessage = 'We couldn\'t process your withdraw request. Do you have sufficient balance?'
            this.lastToastType = 'error'
          }
        })
        .catch(err => {
            this.lastToastMessage = err.message
            this.lastToastType = 'error'
        })
        .then(_ => {
          this.snackbar = true
        })

    },
    closeWithdrawDialog () {
      this.withdrawTokenDialog = false
      this.tokenToWithdraw = null
      this.amountToWithdraw = 0
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
    margin-bottom: 20px;
  }
</style>
