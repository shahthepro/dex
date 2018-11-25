<template>
  <v-app dark>
    <v-navigation-drawer v-if="$route.name == 'trade'" fixed temporary v-model="marketsDrawer" app>
      <v-list dense>
        <v-list-tile class="cdex-token-search-input">
            <v-text-field type="text" placeholder="Search pairs..." v-model="searchText"></v-text-field>
        </v-list-tile>
        <virtual-scroller :items="pairs" item-height="40" buffer="100">
          <template slot-scope="props">
            <v-list-tile v-show="shouldShowPair(props.item)" :key="props.itemKey" @click="changeTradePair(props.item)">
              <v-list-tile-content>
                <v-list-tile-title>{{ props.item }}</v-list-tile-title>
              </v-list-tile-content>
            </v-list-tile>
          </template>
        </virtual-scroller>
      </v-list>
    </v-navigation-drawer>
    <v-toolbar fixed app>
      <v-toolbar-title v-text="title"></v-toolbar-title>
      <v-toolbar-items v-if="$route.name == 'trade'">
          <v-btn @click.stop="marketsDrawer = !marketsDrawer" flat>
            {{ `${$route.params.token}/${$route.params.base}` }}
            <v-icon>arrow_drop_down</v-icon>
          </v-btn>
      </v-toolbar-items>
      <v-spacer></v-spacer>
      <v-toolbar-items>
          <v-btn flat :to="{ name: `trade`, params: { token: ($route.params.token || 'CDX'), base: ($route.params.base || 'ETH') } }">Trade</v-btn>
          <v-menu open-on-hover bottom offset-y>
            <v-btn flat :to="{ name: `orders` }" slot="activator">
              Orders
            </v-btn>
            <v-list>
              <v-list-tile :to="{ name: `orders` }" exact>
                <v-list-tile-title>My Open Orders</v-list-tile-title>
              </v-list-tile>
              <v-list-tile v-if="false" :to="{ name: `user-trades` }" exact>
                <v-list-tile-title>My Trade History</v-list-tile-title>
              </v-list-tile>
            </v-list>
          </v-menu>
          <v-menu open-on-hover bottom offset-y>
            <v-btn flat :to="{ name: `balances` }" slot="activator">
              Balances
            </v-btn>
            <v-list>
              <v-list-tile :to="{ name: `balances` }" exact>
                <v-list-tile-title>Wallet Balances</v-list-tile-title>
              </v-list-tile>
              <v-list-tile :to="{ name: `pending-balances` }" exact>
                <v-list-tile-title>Pending Transactions</v-list-tile-title>
              </v-list-tile>
            </v-list>
          </v-menu>
          <v-btn flat :to="{ name: `help` }"><v-icon>help</v-icon></v-btn>
          <v-btn v-if="!wallet.isConnected" class="error" flat @click.stop="accountDrawer = !accountDrawer">Unlock Wallet</v-btn>
          <v-btn v-if="wallet.isConnected" class="success" flat @click.stop="accountDrawer = !accountDrawer">My Wallet</v-btn>
      </v-toolbar-items>
    </v-toolbar>
    <v-content>
      <router-view></router-view>
    </v-content>
    <v-navigation-drawer temporary right v-model="accountDrawer" width="500" fixed app>
      <div class="p-20">
        <h3 class="headline">My Wallet</h3>
        <UnlockWallet/>
      </div>
    </v-navigation-drawer>
  </v-app>
</template>

<script>
import $router from '@/exchange/router'
// import { LOAD_TOKENS } from '@/store/action-types'
import { mapState } from 'vuex'
import TOKENS from '@/core/tokens'
import UnlockWallet from '@/components/UnlockWallet.vue';

export default {
  name: 'App',
  components: {
    UnlockWallet
  },
  data () {
    return {
      walletDialog: false,
      accountDrawer: false,
      title: 'ChilraDEX',
      marketsDrawer: false,
      pairs: TOKENS.getPairs('ETH'),
      searchText: ''
    }
  },
  computed: {
    wallet: {
      get () {
        return this.$store.getters.wallet
      }
    }
  },
  methods: {
    changeTradePair (pair) {
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
.p-20 {
  padding: 20px;
}
</style>
