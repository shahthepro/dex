<template>
  <v-container fluid fill-height>
    <v-layout row wrap>
      <v-flex d-flex class="left-widget-area">
        <v-layout column wrap>
          <v-flex d-flex class="top-widget expanded">
            <v-card class="ma-2 widget-container">
              <div class="widget-content">
                <PriceChart/>
              </div>
            </v-card>
          </v-flex>
          <v-flex d-flex class="bottom-widget">
            <v-card class="ma-2 widget-container">
                <v-card-title>Open Orders</v-card-title>
                <div class="widget-content-wrapper">
                  <div class="widget-content">
                    <OpenOrders/>
                  </div>
                </div>
            </v-card>
          </v-flex>
        </v-layout>
      </v-flex>
      <v-flex d-flex class="right-widget-area">
        <v-layout row wrap>
          <v-flex d-flex md6 class="top-widget">
            <v-card class="ma-2 widget-container">
                <v-card-title>Orderbook</v-card-title>
                <Orderbook/>
            </v-card>
          </v-flex>
          <v-flex d-flex md6 class="top-widget">
            <v-card class="ma-2 widget-container">
                <v-card-title>Trade History</v-card-title>
                <div class="orderbook-header">
                  <table class="v-table">
                    <thead>
                      <tr>
                        <th width="110px">Time</th>
                        <th>Price</th>
                        <th>Volume</th>
                      </tr>
                    </thead>
                  </table>
                </div>
                <div class="widget-content-wrapper">
                  <div class="widget-content">
                    <TradeHistory />
                  </div>
                </div>
              </div>
            </v-card>
          </v-flex>
          <v-flex d-flex class="bottom-widget">
            <v-card class="ma-2 widget-container">
              <div class="widget-content-wrapper">
                <div class="widget-content">
                  <TradeForm />
                </div>
              </div>
            </v-card>
          </v-flex>
        </v-layout>
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script lang="ts">
import TradeForm from '@/components/TradeForm.vue'
import TradeHistory from '@/components/TradeHistory.vue'
import Orderbook from '@/components/Orderbook.vue'
import OpenOrders from '@/components/OpenOrders.vue'
import PriceChart from '@/components/PVChart.vue'
import store from '@/store'
import { TOKEN_PAIR_NAMESPACE } from '@/core/constants'
import TOKEN_PAIR_INFO_MODULE from '@/store/modules/pair-info/pair-info'
import { SET_TOKEN_PAIR, FETCH_USER_PAIR_ORDERS } from '@/store/action-types'

if (!store.state[TOKEN_PAIR_NAMESPACE]) {
  store.registerModule(TOKEN_PAIR_NAMESPACE, TOKEN_PAIR_INFO_MODULE)
}

export default {
  name: 'Trade',
  components: {
    TradeForm,
    TradeHistory,
    Orderbook,
    OpenOrders,
    PriceChart
  },
  data () {
    return {
    }
  },
  computed: {
    pairInfo () {
      return store.getters.pairInfo
    },
    wallet () {
      return store.getters.wallet.current
    },
  },
  watch: {
    wallet (newWallet) {
      let walletAddress = (newWallet) ? newWallet.address : null
      store.dispatch(FETCH_USER_PAIR_ORDERS, {
        token: store.getters.pairInfo.token,
        base: store.getters.pairInfo.base,
        walletAddress
      })
    }
  },
  beforeRouteEnter (to, from, next) {
    store.dispatch(SET_TOKEN_PAIR, to.params)
    next()
  },
  beforeRouteUpdate (to, from, next) {
    store.dispatch(SET_TOKEN_PAIR, to.params)
    next()
  },
  methods: {
  }
  
}
</script>

<style lang="scss" scoped>
  .container {
    padding: 0px
  }

  .left-widget-area {
    flex: 1 1 auto;
  }
  .right-widget-area {
    flex: 0 0 560px;
  }
  .bottom-widget {
    height: 275px;
  }
  .top-widget {
    height: calc(100% - 275px);
    &.expanded {
      height: calc(100% - 225px);

      & + .bottom-widget {
        height: 225px;
      }
    }
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
  .v-card__title {
    border-bottom: solid 1px #333;
    padding: 10px;
    margin-bottom: 5px;
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
