<template>
  <v-layout>
    <table class="v-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Side</th>
          <th>Price</th>
          <th>Amount</th>
          <th>Filled</th>
          <th>Total</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="text-xs-left">10/12 10:45</td>
          <td class="text-xs-left">Buy</td>
          <td class="text-xs-right">0.000344334</td>
          <td class="text-xs-right">0.000043323</td>
          <td class="text-xs-right">0.000002323</td>
          <td class="text-xs-right">0.0023323</td>
          <td class="text-xs-center"><v-btn small flat color="error">Cancel</v-btn></td>
        </tr>
      </tbody>
    </table>
  </v-layout>
</template>

<script>
export default {
  name: 'OpenOrders',
  data () {
    return {
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
  font-size: 0.8rem;
}
table.v-table thead tr, table.v-table tbody tr td {
  height: 25px;
}
</style>
