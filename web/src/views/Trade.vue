<template>
  <v-container fluid fill-height>
    <v-layout row wrap>
      <v-flex d-flex class="left-widget-area">
        <v-layout column wrap>
          <v-flex d-flex class="top-widget">
            <v-card class="ma-2 widget-container">
              Chart
            </v-card>
          </v-flex>
          <v-flex d-flex class="bottom-widget">
            <v-card class="ma-2 widget-container">
                <v-card-title>Open Orders</v-card-title>
                <div class="widget-content-wrapper">
                  <div class="widget-content">
                    Open Orders
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
                <div class="orderbook-header">
                  <table class="v-table">
                    <thead>
                      <tr>
                        <th>Price</th>
                        <th>Quantity</th>
                      </tr>
                    </thead>
                  </table>
                </div>
                <div class="widget-content-wrapper">
                  <div class="widget-content">
                    <Orderbook/>
                  </div>
                </div>
                <div class="last-price">
                  0.000321
                </div>
                <div class="widget-content-wrapper">
                  <div class="widget-content">
                    <Orderbook/>
                  </div>
                </div>
            </v-card>
          </v-flex>
          <v-flex d-flex md6 class="top-widget">
            <v-card class="ma-2 widget-container">
                <v-card-title>Trade History</v-card-title>
                <div class="orderbook-header">
                  <table class="v-table">
                    <thead>
                      <tr>
                        <th>Time</th>
                        <th>Price</th>
                        <th>Quantity</th>
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
                  <TradeForm base="ETH" token="CDX" />
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
import TradeForm from '@/components/TradeForm.vue';
import TradeHistory from '@/components/TradeHistory.vue';
import Orderbook from '@/components/Orderbook.vue';

export default {
  name: 'Trade',
  components: {
    TradeForm,
    TradeHistory,
    Orderbook
  },
  data () {
    return {
      lorem: `Lorem ipsum dolor sit amet, mel at clita quando. Te sit oratio vituperatoribus, nam ad ipsum posidonium mediocritatem, explicari dissentiunt cu mea. Repudiare disputationi vim in, mollis iriure nec cu, alienum argumentum ius ad. Pri eu justo aeque torquatos.Lorem ipsum dolor sit amet, mel at clita quando. Te sit oratio vituperatoribus, nam ad ipsum posidonium mediocritatem, explicari dissentiunt cu mea. Repudiare disputationi vim in, mollis iriure nec cu, alienum argumentum ius ad. Pri eu justo aeque torquatos.Lorem ipsum dolor sit amet, mel at clita quando. Te sit oratio vituperatoribus, nam ad ipsum posidonium mediocritatem, explicari dissentiunt cu mea. Repudiare disputationi vim in, mollis iriure nec cu, alienum argumentum ius ad. Pri eu justo aeque torquatos.`
    }
  }
}
</script>

<style lang="scss" scoped>
  .left-widget-area {
    flex: 1 1 auto;
  }
  .right-widget-area {
    flex: 0 0 560px;
  }
  .bottom-widget {
    height: 325px;
  }
  .top-widget {
    height: calc(100% - 325px);
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
