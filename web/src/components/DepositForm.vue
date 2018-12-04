<template>
  <v-card>
    <v-card-text>
      <v-form ref="valid" v-model="valid">
        <v-autocomplete v-model="selectedToken" :items="tokens" hide-selected item-text="symbol" item-value="symbol" label="Select a token"
          :rules="[rules.required]">
          <template
            slot="item"
            slot-scope="{ item, tile }"
          >
            <v-list-tile-content>
              <v-list-tile-title v-text="item.symbol"></v-list-tile-title>
              <v-list-tile-sub-title v-if="item.symbol != 'ETH'" v-text="item.address"></v-list-tile-sub-title>
            </v-list-tile-content>
            <v-list-tile-action>
              <v-icon>mdi-coin</v-icon>
            </v-list-tile-action>
          </template>
        </v-autocomplete>

        <v-text-field v-model="amountToDeposit" label="Amount" :suffix="selectedToken" required :rules="[rules.number]"></v-text-field>
        <v-text-field v-model="gasPrice" label="Gas Price" :suffix="`GWEI`" required :rules="[rules.number]"></v-text-field>

      </v-form>
    </v-card-text>
    <v-card-actions>
      <v-btn block large color="success" :disabled="loading" :loading="loading" v-on:click="transfer">DEPOSIT</v-btn>
    </v-card-actions>
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
  </v-card>
</template>

<script>
  // import HomeBridge from '@/utils/home-bridge.contract';
  // import BigNumber from 'bn.js';

import FORM_RULES from '@/utils/form-rules'
import TOKENS from '@/core/tokens'

import store from '@/store'
import { DEPOSIT_FORM_NAMESPACE } from '@/core/constants'
import DEPOSIT_FORM_STORE_MODULE from '@/store/modules/bridge/deposit-form'

import { SET_DEPOSITFORM_AMOUNT, SET_DEPOSITFORM_GASPRICE, SET_DEPOSITFORM_TOKEN } from '@/store/action-types'

if (!store.state[DEPOSIT_FORM_NAMESPACE]) {
  store.registerModule(DEPOSIT_FORM_NAMESPACE, DEPOSIT_FORM_STORE_MODULE)
}

import Bridge from '@/utils/bridge'

export default {
  name: 'DepositForm',
  props: {
  },
  data() {
    return {
      valid: null,

      // selectedToken: null,
      // amountToDeposit: null,
      // gasPrice: null,
      // gasLimit: null,
      snackbar: false,
      lastToastMessage: '',
      lastToastType: 'success',

      lastTxHash: '',
      loading: false,
      lastTxError: '',

      tokens: TOKENS.get(),

      rules: FORM_RULES
    }
  },
  computed: {
    // isWalletConnected() {
    //   return this.$store.state.isWalletConnected
    // },
    // wallet() {
    //   return this.$store.state.wallet
    // },
    selectedToken: {
      get () {
        return this.$store.state[DEPOSIT_FORM_NAMESPACE].token
      },
      set (value) {
        if (value != null) {
          this.$store.dispatch(SET_DEPOSITFORM_TOKEN, value)
        }
      }
    },
    gasPrice: {
      get () {
        return this.$store.state[DEPOSIT_FORM_NAMESPACE].gasPrice
      },
      set (value) {
        if (this.rules.number(value) === true && value > 0) {
          this.$store.dispatch(SET_DEPOSITFORM_GASPRICE, value)
        }
      }
    },
    amountToDeposit: {
      get () {
        return this.$store.state[DEPOSIT_FORM_NAMESPACE].amount
      },
      set (value) {
        if (this.rules.number(value) === true && value > 0) {
          this.$store.dispatch(SET_DEPOSITFORM_AMOUNT, value)
        }
      }
    },
  },
  created() {
    this.$store.dispatch(SET_DEPOSITFORM_GASPRICE, 8);
    // this.gasLimit = 35000;
  },
  methods: {
    transfer() {
      this.snackbar = false
      if (this.valid) {
        this.loading = true
        // this.lastTxError = '';
        // this.lastTxHash = '';
        Bridge.deposit()
          .then(receipt => {
            if (receipt.status == 1) {
              this.lastToastMessage = 'Tokens have been securely transferred to CDEX blockchain'
              this.lastToastType = 'success'
              // this.lastTxHash = receipt.transactionHash
              this.$refs.valid.reset()
            } else {
              this.lastToastMessage = `Something went wrong, Do you have sufficient funds?`;
              this.lastToastType = 'error'
            }
          })
          .catch(err => {
            this.lastToastMessage = err.message
            this.lastToastType = 'error'
          })
          .then(_ => {
            this.loading = false
            this.snackbar = true
          })
      }
    }
  }
}
</script>

<style lang="scss" scoped>
</style>