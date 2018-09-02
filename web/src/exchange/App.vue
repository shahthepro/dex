<template>
  <v-app dark>
    <v-navigation-drawer fixed temporary v-model="marketsDrawer" app>
      <v-list dense>
        <v-list-tile class="cdex-token-search-input">
            <v-text-field type="text" placeholder="Search pairs..."></v-text-field>
        </v-list-tile>
        <v-list-tile v-for="pair in pairs" :key="pair" @click="changeTradePair(pair)">
          <v-list-tile-content>
            <v-list-tile-title>{{ pair }}</v-list-tile-title>
          </v-list-tile-content>
        </v-list-tile>
      </v-list>
    </v-navigation-drawer>
    <v-toolbar fixed app>
      <v-toolbar-title v-text="title"></v-toolbar-title>
      <v-toolbar-items>
          <v-btn @click.stop="marketsDrawer = !marketsDrawer" flat>
            {{ tokenpair }}
            <v-icon>arrow_drop_down</v-icon>
          </v-btn>
      </v-toolbar-items>
      <v-spacer></v-spacer>
      <v-toolbar-items>
          <v-btn flat :to="{ name: `trade` }">Trade</v-btn>
          <v-btn flat :to="{ name: `orders` }">Orders</v-btn>
          <v-btn flat :to="{ name: `balances` }">Balances</v-btn>
          <v-btn flat :to="{ name: `help` }"><v-icon>help</v-icon></v-btn>
      </v-toolbar-items>
      <v-btn icon @click.stop="accountDrawer = !accountDrawer">
        <v-icon>account_circle</v-icon>
      </v-btn>
    </v-toolbar>
    <v-content>
      <router-view></router-view>
    </v-content>
    <v-navigation-drawer temporary right v-model="accountDrawer" fixed app>
      <div>HelloWorld</div>
    </v-navigation-drawer>
  </v-app>
</template>

<script>
export default {
  name: 'App',
  data () {
    return {
      accountDrawer: false,
      title: 'ChilraDEX',
      tokenpair: 'CDX/ETH',
      marketsDrawer: false,
      pairs: [
        'CDX/ETH',
        'VEN/ETH',
        'BNB/ETH',
        'GNT/ETH',
        'NEO/ETH',
        'BTC/ETH',
        'XMR/ETH'
      ]
    }
  },
  methods: {
    changeTradePair (pair) {
      this.tokenpair = pair;
    }
  }
}
</script>

<style scoped>
.v-toolbar__title {
  margin-right: 15px;
}
.v-list .cdex-token-search-input {
  margin: 10px 0;
}
</style>
