<template>
    <v-layout fill-height align-center class="cb-hero-layout">
        <v-flex>
            <v-container justify-center>
                <h1>Transfer your tokens from and to KirukkuDEX blockchain securely</h1>

                <v-flex class="cb-hero-primary-actions">
                    <v-btn dark large outline :to="{ name: `deposit` }">Deposit</v-btn>
                    <v-btn dark large outline :to="{ name: `withdraw` }">Withdraw</v-btn>
                </v-flex>

                <v-flex>
                    <v-btn dark flat small :to="{ name: `help` }">Know More about KirukkuDEX Bridge</v-btn>
                </v-flex>

                <v-flex class="cb-hero-social-links">
                </v-flex>
            </v-container>
        </v-flex>
    </v-layout>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'

@Component({
})
export default class Home extends Vue {}
</script>

<style lang="scss" scoped>
    .cb-hero-layout {
        background: url('./../assets/bg-pattern.png'), #7b4397;
        background: url("./../assets/bg-pattern.png"), -webkit-linear-gradient(to left, #7b4397, #dc2430);
        background: url("./../assets/bg-pattern.png"), linear-gradient(to left, #7b4397, #dc2430);
        text-align: center;

        .container {
            max-width: 800px;
        }

        .cb-hero-primary-actions {
            margin-bottom: 20px;
        }

        .cb-hero-social-links {
            margin: 20px 0;
        }

        h1 {
            font-weight: 200;
            font-size: 3.5em;
            margin: 40px 0;
        }

        @media only screen and (max-device-width : 799px) {
            h1 {
                font-size: 2.5em;
            }
        }

        color: rgba(255, 255, 255, 0.86);
    }
</style>
