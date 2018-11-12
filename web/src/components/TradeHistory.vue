<template>
  <v-layout>
    <table class="v-table">
      <tbody>
        <tr v-for="row in tradeHistory">
          <td width="110px" class="text-xs-left">{{ row.traded_at }}</td>
          <td class="text-xs-right" v-bind:class="{ 'success--text': row.trend, 'error--text': !row.trend }">{{ row.price }}</td>
          <td class="text-xs-right">{{ row.volume }}</td>
        </tr>
      </tbody>
    </table>
  </v-layout>
</template>

<script>
export default {
  name: 'TradeHistory',
  data () {
    return {
    }
  },
  computed: {
    tradeHistory: {
      get () {
        return this.$store.getters.tradeHistory
      }
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
