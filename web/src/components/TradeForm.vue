<template>
  <v-layout class="trade-form" fill-height>
    <v-tabs v-model="side" fixed-tabs>
      <v-tab>Buy</v-tab>
      <v-tab>Sell</v-tab>
    </v-tabs>
    <v-form ref="form" v-model="valid" class="pa-2">
      <v-text-field v-model="price" label="Price" :suffix="pairInfo.base" required :rules="[rules.number]"></v-text-field>
      <v-text-field v-model="amount" label="Amount" :suffix="pairInfo.token" required :rules="[rules.number]"></v-text-field>
      <div class="mt-3 mb-3">Total &cong; {{ volume }} {{ pairInfo.base }}</div>

      <v-card-text 
          v-if="lastTxError.length > 0" 
          class="cb-error-text">{{ lastTxError }}</v-card-text>
      </v-card-text>

      <v-btn :loading="loading" :disabled="loading || !valid" :color="side == 0 ? 'success' : 'error'" @click="placeOrder" block>
        {{ side == 0 ? "Buy" : "Sell" }} {{ pairInfo.token }}
      </v-btn>
    </v-form>
  </v-layout>
</template>

<script>
import FORM_RULES from '@/utils/form-rules'
import { TOKEN_PAIR_NAMESPACE } from '@/core/constants'
import { SET_TRADEFORM_PRICE, SET_TRADEFORM_SIDE, SET_TRADEFORM_AMOUNT } from '@/store/action-types'
import Exchange from '@/utils/exchange'
export default {
  name: 'TradeForm',
  data () {
    return {
      loading: false,
      valid: null,
      volume: 0,
      lastTxHash: '',
      lastTxError: '',
      rules: FORM_RULES
    }
  },
  computed: {
    pairInfo () {
      return this.$store.state[TOKEN_PAIR_NAMESPACE]
    },
    price: {
      get () {
        return this.$store.state[TOKEN_PAIR_NAMESPACE].tradeForm.price
      },
      set (value) {
        if (this.rules.number(value) === true && value > 0) {
          this.$store.dispatch(SET_TRADEFORM_PRICE, value);
        }
      }
    },
    amount: {
      get () {
        return this.$store.state[TOKEN_PAIR_NAMESPACE].tradeForm.amount
      },
      set (value) {
        if (this.rules.number(value) === true && value > 0) {
          this.$store.dispatch(SET_TRADEFORM_AMOUNT, value);
        }
      }
    },
    side: {
      get () {
        return this.$store.state[TOKEN_PAIR_NAMESPACE].tradeForm.side
      },
      set (value) {
        this.$store.dispatch(SET_TRADEFORM_SIDE, value);
      }
    },
  },
  watch: {
    price: function (newPrice, _) {
      this.volume = this.computeVolume(newPrice, this.amount)
    },
    amount:  function(newAmount, _) {
      this.volume = this.computeVolume(this.price, newAmount)
    },
  },
  methods: {
    computeVolume (price, amount) {
      let volume = price * amount
      if (volume) {
        return parseInt(volume * 100000000) / 100000000
      }
      return 0
    },
    placeOrder () {
      this.loading = true
      this.lastTxError = '';
      this.lastTxHash = '';
      if (this.valid) {
        Exchange.placeOrder()
          .then(receipt => {
            if (receipt.status == 1) {
              this.lastTxHash = receipt.transactionHash
            } else {
              this.lastTxError = `Something went wrong, Do you have sufficient funds?`;
            }
            // this.$refs.form.reset()
          })
          .catch(err => {
            this.lastTxError = err.message
          })
          .then(_ => {
            this.loading = false
          })
      }
    },
  },
}
</script>

<style lang="scss" scoped>
  .trade-form {
    padding: 0 2rem;
    width: 100%;
    display: block;
  }
</style>
