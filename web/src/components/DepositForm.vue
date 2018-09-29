<template>
  <v-card>
    <v-card-text>
      <v-form ref="form" v-model="form">
        <v-autocomplete v-model="selectedToken" :items="tokens" hide-selected item-text="name" item-value="addr" label="Select a token"
          :rules="[rules.required]">
        </v-autocomplete>
        <v-text-field v-model="amountToDeposit" name="amount" label="Amount to deposit" type="text" :rules="[rules.number]"></v-text-field>
        <v-text-field v-model="gasPrice" name="gasPrice" label="Gas price (in gwei)" type="text" :rules="[rules.number]"></v-text-field>
      </v-form>
    </v-card-text>
    <v-card-actions>
      <v-btn block large color="success" :disabled="isTxInProgress || !form" :loading="isTxInProgress" v-on:click="transfer">DEPOSIT</v-btn>
    </v-card-actions>
    <v-card-text v-if="lastTxError.length > 0" class="cb-error-text">{{ lastTxError }}</v-card-text>
    </v-card-text>
    <v-card-text v-if="lastTxHash.length > 0">
      <code>Your transaction has been submitted with the hash: '{{ lastTxHash }}'</code></v-card-text>
    </v-card-text>
  </v-card>
</template>

<script>
  // import HomeBridge from '@/utils/home-bridge.contract';
  // import BigNumber from 'bn.js';

  export default {
    name: 'DepositForm',
    props: {
    },
    data() {
      return {
        form: null,

        selectedToken: null,
        amountToDeposit: null,
        gasPrice: null,
        gasLimit: null,

        lastTxHash: '',
        isTxInProgress: false,
        lastTxError: '',

        rules: {
          required(value) {
            return (value != null && value.length > 0) || 'This is required'
          },
          number(value) {
            return (value.length > 0 && /^[0-9]*\.?[0-9]+$/.test(value)) || `Please enter a valid number`
          }
        }
      }
    },
    computed: {
      isWalletConnected() {
        return this.$store.state.isWalletConnected
      },
      wallet() {
        return this.$store.state.wallet
      },
      tokens() {
        return this.$store.state.supportedTokens
      },
      appConfig() {
        return this.$store.state.config
      }
    },
    mounted() {
      this.gasPrice = 8;
      this.gasLimit = 35000;
    },
    methods: {
      transfer() {
        // if (!this.isWalletConnected) {
        //     this.lastTxError = 'You have not connected a wallet yet. Connect a wallet and then try again.'
        //     return
        // }
        // this.isTxInProgress = true;
        // this.lastTxError = '';
        // this.lastTxHash = '';
        // HomeBridge.deposit(
        //     this.selectedToken, 
        //     new BigNumber(this.amountToDeposit), 
        //     new BigNumber(this.gasLimit),
        //     new BigNumber(this.gasPrice),
        // )
        // .then((txHash) => {
        //     this.lastTxHash = txHash
        //     const gasPrice = this.gasPrice
        //     this.$refs.form.reset()
        //     this.gasPrice = gasPrice
        // })
        // .catch((e) => {
        //     this.lastTxError = e.message;
        // })
        // .then(() => {
        //     this.isTxInProgress = false;
        // });
      }
    }
  }
</script>

<style lang="scss" scoped>
</style>