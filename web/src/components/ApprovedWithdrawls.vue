<template>
  <v-card>
    <v-list>
      <v-list-tile v-for="item in items" :key="item.title">
        <v-list-tile-content>
          <v-list-tile-title>{{ `${item.amount} ${item.symbol}` }}</v-list-tile-title>
        </v-list-tile-content>

        <v-list-tile-action>
          <v-btn small flat outline @click="accept(item)" color="success">Accept</v-btn>
        </v-list-tile-action>
      </v-list-tile>
    </v-list>
  </v-card>
</template>

<script>
  // import HomeBridge from '@/utils/home-bridge.contract';
  // import BigNumber from 'bn.js';

  // console.log(HomeBridge.getSign)

  export default {
    name: 'ApprovedWithdrawls',
    props: {
    },
    data() {
      return {
        items: [
          { token: '0x0000000000000000000000000000000000000000', amount: 2.545, symbol: 'ETH' },
          { token: '0x0000000000000000000000000000000000000000', amount: 2.2, symbol: 'VEN' },
          { token: '0x0000000000000000000000000000000000000000', amount: 1.0, symbol: 'BTC' }
        ],
      }
    },
    computed: {
      isWalletConnected() {
        return this.$store.state.isWalletConnected
      },
      wallet() {
        return this.$store.state.wallet
      },
      web3() {
        return this.$store.state.web3
      },
      tokens() {
        return this.$store.state.supportedTokens
      }
    },
    methods: {
      accept(item) {
        // HomeBridge.withdrawRequest(
        //   item.token,
        //   new BigNumber(item.amount),
        //   new BigNumber(500000),
        //   new BigNumber(1)
        // )
        //   .then((tx) => {
        //     console.log(tx)
        //   })
        //   .catch((err) => {
        //     console.error(err)
        //   })
        // try {
        //     this.$store.dispatch('registerWeb3')
        // } catch (e) {
        //     console.warn(e)
        // }
      }
    }
  }
</script>

<style lang="scss" scoped>
</style>