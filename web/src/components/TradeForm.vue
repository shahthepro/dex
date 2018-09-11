<template>
  <v-layout class="trade-form" fill-height>
    <v-tabs v-model="side" fixed-tabs>
      <v-tab>Buy</v-tab>
      <v-tab>Sell</v-tab>
    </v-tabs>
    <v-form v-model="valid" class="pa-2">
      <v-text-field v-model="price" label="Price" :suffix="pairInfo.base" required></v-text-field>
      <v-text-field v-model="amount" label="Amount" :suffix="pairInfo.token" required></v-text-field>
      <div class="mt-3 mb-3">Total = {{ volume }} {{ pairInfo.base }}</div>
      <v-btn :color="side == 0 ? 'success' : 'error'" block>{{ side == 0 ? "Buy" : "Sell" }} {{ pairInfo.token }}</v-btn>
    </v-form>
  </v-layout>
</template>

<script>
import { TOKEN_PAIR_INFO } from '@/core/constants'
export default {
  name: 'TradeForm',
  data () {
    return {
      side: null,
      valid: null,
      price: null,
      amount: null,
      volume: 0
    }
  },
  computed: {
    pairInfo () {
      return this.$store.state[TOKEN_PAIR_INFO]
    }
  },
  watch: {
    price: function (newPrice, _) {
      this.volume = (newPrice * this.amount) || 0;
    },
    amount:  function(newAmount, _) {
      this.volume = (newAmount * this.price) || 0;
    },
  }
}
</script>

<style lang="scss" scoped>
  .trade-form {
    padding: 0 2rem;
    width: 100%;
    display: block;
  }
</style>
