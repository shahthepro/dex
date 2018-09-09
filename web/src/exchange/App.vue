<template>
  <v-app dark>
    <v-navigation-drawer fixed temporary v-model="marketsDrawer" app>
      <v-list dense>
        <v-list-tile class="cdex-token-search-input">
            <v-text-field type="text" placeholder="Search pairs..." v-model="searchText"></v-text-field>
        </v-list-tile>
        <v-list-tile v-for="pair in pairs" v-show="shouldShowPair(pair)" :key="pair" @click="changeTradePair(pair)">
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
          <v-btn flat :to="{ name: `trade`, params: { token:'CDX', base: 'ETH' } }">Trade</v-btn>
          <v-btn flat :to="{ name: `orders` }">Orders</v-btn>
          <v-btn flat :to="{ name: `balances` }">Balances</v-btn>
          <v-btn flat :to="{ name: `help` }"><v-icon>help</v-icon></v-btn>
          <v-btn class="error" flat @click.stop="accountDrawer = !accountDrawer">Unlock Account</v-btn>
      </v-toolbar-items>
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
import $router from '@/exchange/router'
// import { LOAD_TOKENS } from '@/store/action-types'
import { mapState } from 'vuex'
import TOKENS from '@/core/tokens'

export default {
  name: 'App',
  data () {
    return {
      accountDrawer: false,
      title: 'ChilraDEX',
      tokenpair: 'CDX/ETH',
      marketsDrawer: false,
      pairs: TOKENS.getPairs('ETH'),
      searchText: ''
    }
  },
  // computed: {
  //   pairs () {
  //     return TOKENS.getPairs()
  //   }
  // },
  methods: {
    changeTradePair (pair) {
      this.tokenpair = pair;
      let s = pair.split('/');
      $router.push({ name: 'trade', params: { token: s[0], base: s[1] }})
    },
    shouldShowPair (pair) {
      return this.searchText.length == 0 || pair.includes(this.searchText.toUpperCase())
    }
  },
  async beforeCreate () {
    // await this.$store.dispatch(LOAD_TOKENS);
  },
  created () {
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
