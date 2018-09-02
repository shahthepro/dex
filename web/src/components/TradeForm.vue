<template>
  <v-layout class="trade-form" fill-height>
    <v-tabs v-model="side" fixed-tabs>
      <v-tab>Buy</v-tab>
      <v-tab>Sell</v-tab>
    </v-tabs>
    <v-form v-model="valid" class="pa-2">
      <v-text-field v-model="price" label="Price" :suffix="base" required></v-text-field>
      <v-text-field v-model="amount" label="Amount" :suffix="token" required></v-text-field>
      <div class="mt-3 mb-3">Total = {{ volume || 0 }} {{ base }}</div>
      <v-btn :color="side == 0 ? 'success' : 'error'" block>{{ side == 0 ? "Buy" : "Sell" }} {{ token }}</v-btn>
    </v-form>
  </v-layout>
</template>

<script>
export default {
  name: 'TradeForm',
  props: {
    token: String,
    base: String
  },
  data () {
    return {
      side: null,
      valid: null,
      price: null,
      amount: null,
      volume: null
    }
  },
  watch: {
    price: function (newPrice, _) {
      this.volume = newPrice * this.amount;
    },
    amount:  function(newAmount, _) {
      this.volume = newAmount * this.price;
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
