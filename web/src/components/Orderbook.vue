<template>
  <v-layout class="widget-container">
    <div class="orderbook-header">
      <table class="v-table">
        <thead>
          <tr>
            <th>Price</th>
            <th>Volume</th>
          </tr>
        </thead>
      </table>
    </div>
    <div class="widget-content-wrapper" ref="askOrderbookWrapper">
      <div class="widget-content">
    <table class="v-table">
      <tbody>
        <tr v-for="ask in orderbook.asks">
          <td class="error--text">{{ ask.price }}</td>
          <td class="error--text">{{ ask.volume }}</td>
        </tr>
      </tbody>
    </table>
      </div>
    </div>
    <div class="last-price">
      {{ this.orderbook.last_price }}
    </div>
    <div class="widget-content-wrapper">
      <div class="widget-content">
    <table class="v-table">
      <tbody>
        <tr v-for="bid in orderbook.bids">
          <td class="success--text">{{ bid.price }}</td>
          <td class="success--text">{{ bid.volume }}</td>
        </tr>
      </tbody>
    </table>
      </div>
    </div>
  </v-layout>
</template>

<script>
export default {
  name: 'Orderbook',
  data () {
    return {
    }
  },
  computed: {
    orderbook: {
      get () {
        return this.$store.getters.orderbook
      }
    }
  },
  watch: {
    orderbook (_) {
      let wrapper = this.$refs.askOrderbookWrapper
      wrapper.scrollTop = wrapper.scrollHeight
    }
  },
  updated() {
    let wrapper = this.$refs.askOrderbookWrapper
    wrapper.scrollTop = wrapper.scrollHeight
  },
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


.widget-container {
  display: flex;
  flex-direction: column;
}
.widget-content-wrapper {
  position: relative;
  overflow: auto;
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
}
.widget-content {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}
.last-price {
  padding: 3px;
  font-size: 14px;
  text-align: center;
}
table.v-table thead tr {
  height: 25px;
}
</style>
