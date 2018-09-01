<template>
  <v-container fluid fill-height>
    <v-layout row wrap>
      <v-flex d-flex class="pa-2" xs12 sm12 md6>
        <v-card>
          Chart
        </v-card>
      </v-flex>
      <v-flex d-flex class="pa-2" xs12 sm12 md3>
        <v-card>
          Orderbook
        </v-card>
      </v-flex>
      <v-flex d-flex class="pa-2" xs12 sm12 md3>
        <v-card>
          Trade History
        </v-card>
      </v-flex>
      <v-flex d-flex class="pa-2" xs12 sm12 md6>
        <v-card>
          Open Orders
        </v-card>
      </v-flex>
      <v-flex d-flex class="pa-2" xs12 sm12 md6>
        <v-card>
          Buy/Sell
        </v-card>
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script lang="ts">
export default {
  name: 'HelloWorld',
  data () {
    return {
      lorem: `Lorem ipsum dolor sit amet, mel at clita quando. Te sit oratio vituperatoribus, nam ad ipsum posidonium mediocritatem, explicari dissentiunt cu mea. Repudiare disputationi vim in, mollis iriure nec cu, alienum argumentum ius ad. Pri eu justo aeque torquatos.Lorem ipsum dolor sit amet, mel at clita quando. Te sit oratio vituperatoribus, nam ad ipsum posidonium mediocritatem, explicari dissentiunt cu mea. Repudiare disputationi vim in, mollis iriure nec cu, alienum argumentum ius ad. Pri eu justo aeque torquatos.Lorem ipsum dolor sit amet, mel at clita quando. Te sit oratio vituperatoribus, nam ad ipsum posidonium mediocritatem, explicari dissentiunt cu mea. Repudiare disputationi vim in, mollis iriure nec cu, alienum argumentum ius ad. Pri eu justo aeque torquatos.`
    }
  }
}
</script>
