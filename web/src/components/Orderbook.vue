<template>
  <v-layout>
    <table class="v-table">
      <tbody>
        <tr>
          <td>0.000344334</td>
          <td>0.000043323</td>
        </tr>
        <tr>
          <td>0.000344334</td>
          <td>0.000043323</td>
        </tr>
        <tr>
          <td>0.000344334</td>
          <td>0.000043323</td>
        </tr>
        <tr>
          <td>0.000344334</td>
          <td>0.000043323</td>
        </tr>
        <tr>
          <td>0.000344334</td>
          <td>0.000043323</td>
        </tr>
        <tr>
          <td>0.000344334</td>
          <td>0.000043323</td>
        </tr>
        <tr>
          <td>0.000344334</td>
          <td>0.000043323</td>
        </tr>
        <tr>
          <td>0.000344334</td>
          <td>0.000043323</td>
        </tr>
        <tr>
          <td>0.000344334</td>
          <td>0.000043323</td>
        </tr>
        <tr>
          <td>0.000344334</td>
          <td>0.000043323</td>
        </tr>
        <tr>
          <td>0.000344334</td>
          <td>0.000043323</td>
        </tr>
        <tr>
          <td>0.000344334</td>
          <td>0.000043323</td>
        </tr>
        <tr>
          <td>0.000344334</td>
          <td>0.000043323</td>
        </tr>
        <tr>
          <td>0.000344334</td>
          <td>0.000043323</td>
        </tr>
        <tr>
          <td>0.000344334</td>
          <td>0.000043323</td>
        </tr>
        <tr>
          <td>0.000344334</td>
          <td>0.000043323</td>
        </tr>
        <tr>
          <td>0.000344334</td>
          <td>0.000043323</td>
        </tr>
        <tr>
          <td>0.000344334</td>
          <td>0.000043323</td>
        </tr>
      </tbody>
    </table>
  </v-layout>
</template>

<script>
export default {
  name: 'Orderbook',
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
table.v-table thead td:not(:nth-child(1)), table.v-table tbody td:not(:nth-child(1)), table.v-table thead th:not(:nth-child(1)), table.v-table tbody th:not(:nth-child(1)), table.v-table thead td:first-child, table.v-table tbody td:first-child, table.v-table thead th:first-child, table.v-table tbody th:first-child {
  padding: 0 5px;
}
.v-table tr {
  max-width: 100%;
}
.v-table tr td {
  white-space: nowrap;
  font-size: 0.8rem;
}
table.v-table thead tr, table.v-table tbody tr td {
  height: 25px;
}
</style>
