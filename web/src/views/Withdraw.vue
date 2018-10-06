<template>
    <v-container>
        <v-layout row wrap class="cb-grid">
            <v-flex xs12 sm12 md6>
                <h1>Choose a wallet</h1>
                <UnlockWallet />
            </v-flex>
            <v-flex xs12 sm12 md6>
                <h1>... and withdraw tokens</h1>
                <ApprovedWithdrawls />
            </v-flex>
        </v-layout>
    </v-container>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import ApprovedWithdrawls from '@/components/ApprovedWithdrawls.vue';
import UnlockWallet from '@/components/UnlockWallet.vue';

@Component({
    components: {
        ApprovedWithdrawls,
        UnlockWallet
    },
})
export default class Withdraw extends Vue {}
</script>

<style lang="scss" scoped>
    .cb-grid {
        & > .flex {
            padding: 12px;
        }
    }
    .container {
        padding-left: 0;
        padding-right: 0;
    }

    h1 {
        font-weight: 200;
        font-size: 2em;
        margin-bottom: 20px;
    }
</style>
