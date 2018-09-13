<template>
  <v-layout class="trade-form" fill-height>
    <v-tabs v-model="side" fixed-tabs>
      <v-tab>Buy</v-tab>
      <v-tab>Sell</v-tab>
    </v-tabs>
    <v-form v-model="valid" class="pa-2">
      <v-text-field v-model="price" label="Price" :suffix="pairInfo.base" required :rules="[rules.number]"></v-text-field>
      <v-text-field v-model="amount" label="Amount" :suffix="pairInfo.token" required :rules="[rules.number]"></v-text-field>
      <div class="mt-3 mb-3">Total &cong; {{ volume }} {{ pairInfo.base }}</div>
      <v-btn :color="side == 0 ? 'success' : 'error'" block>{{ side == 0 ? "Buy" : "Sell" }} {{ pairInfo.token }}</v-btn>
    </v-form>
  </v-layout>
</template>

<script>
import { TOKEN_PAIR_NAMESPACE } from '@/core/constants'
import { SET_TRADEFORM_PRICE, SET_TRADEFORM_SIDE, SET_TRADEFORM_AMOUNT } from '@/store/action-types'
export default {
  name: 'TradeForm',
  data () {
    return {
      valid: null,
      volume: 0,
      rules: {
        required(value) {
          return (value != null && value.length > 0) || 'This is required'
        },
        number(value) {
          return (value.length > 0 && /^[0-9]*\.?[0-9]+$/.test(value)) || `Please enter a valid number`
        }
      }
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
        if (this.rules.number(value) === true) {
          this.$store.dispatch(SET_TRADEFORM_PRICE, value);
        }
      }
    },
    amount: {
      get () {
        return this.$store.state[TOKEN_PAIR_NAMESPACE].tradeForm.amount
      },
      set (value) {
        if (this.rules.number(value) === true) {
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
    }
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
