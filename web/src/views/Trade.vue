<template>
  <v-container fluid fill-height>
    <v-layout row wrap>
      <v-flex d-flex class="left-widget-area">
        <v-layout column wrap>
          <v-flex d-flex class="top-widget">
            <v-card class="ma-2">
              Chart
            </v-card>
          </v-flex>
          <v-flex d-flex class="bottom-widget">
            <v-card class="ma-2">
              Open Orders
            </v-card>
          </v-flex>
        </v-layout>
      </v-flex>
      <v-flex d-flex class="right-widget-area">
        <v-layout row wrap>
          <v-flex d-flex md6 class="top-widget">
            <v-card class="ma-2">
              Orderbook
            </v-card>
          </v-flex>
          <v-flex d-flex md6 class="top-widget">
            <v-card class="ma-2">
              Trade History
            </v-card>
          </v-flex>
          <v-flex d-flex class="bottom-widget">
            <v-card class="ma-2">
              <TradeForm base="ETH" token="CDX" />
            </v-card>
          </v-flex>
        </v-layout>
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script lang="ts">
import TradeForm from '@/components/TradeForm.vue';

export default {
  name: 'HelloWorld',
  components: {
    TradeForm
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
</style>
