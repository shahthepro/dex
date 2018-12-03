<template>
  <v-flex>
    <v-flex v-if="isWalletConnected">
      <v-alert :value="true" type="success">
        You have connected the wallet with address {{ wallet.address }}
      </v-alert>
      <v-flex class="text-xs-center">
        <v-btn large color="primary" v-on:click="changeWallet">Use another wallet</v-btn>
      </v-flex>
    </v-flex>

    <v-expansion-panel v-if="!isWalletConnected" popout>
      <v-expansion-panel-content>
        <div slot="header">Create New Wallet</div>
        <v-card>
          <v-card-text>
            <v-text-field v-model="newWalletPassphrase" label="Password to encrypt private key" type="password"></v-text-field>
            <v-flex class="text-xs-center">
              <v-btn large color="primary" :loading="newWalletLoading" :disabled="newWalletLoading" v-on:click="createNewKeystore">Create
                Wallet</v-btn>
            </v-flex>
          </v-card-text>
          <v-card-text v-if="newWalletError.length > 0" class="cb-error-text">{{ newWalletError }}</v-card-text>
        </v-card>
      </v-expansion-panel-content>
      <v-expansion-panel-content>
        <div slot="header">Software Wallet (MetaMask, Mist, TrustWallet, etc.)</div>
        <v-card>
          <v-card-text class="text-xs-center">
            <v-btn large color="primary" :loading="softwareWalletLoading" :disabled="softwareWalletLoading" v-on:click="connectSoftwareWallet">Connect
              Wallet</v-btn>
          </v-card-text>
          <v-card-text v-if="softwareWalletError.length > 0" class="cb-error-text">{{ softwareWalletError }}</v-card-text>
        </v-card>
      </v-expansion-panel-content>
      <v-expansion-panel-content>
        <div slot="header">Keystore / JSON File</div>
        <v-card>
          <v-card-text class="cb-warning-text">
            This is not a recommended way to use access your wallet. Use with caution.
          </v-card-text>
          <v-card-text>
            <file-input v-model="keystoreFile" :accept="`.json`" @formData="keystoreFileChanged" @clearFile="keystoreFileCleared"
              label="Select your keystore/JSON file"></file-input>
            <v-text-field v-model="keystorePassphrase" label="Password" type="password"></v-text-field>
            <v-flex class="text-xs-center">
              <v-btn large color="primary" :loading="keystoreWalletLoading" :disabled="keystoreWalletLoading"
                v-on:click="unlockWithKeystoreFile">Unlock Wallet</v-btn>
            </v-flex>
          </v-card-text>
          <v-card-text v-if="keystoreWalletError.length > 0" class="cb-error-text">{{ keystoreWalletError }}</v-card-text>
        </v-card>
      </v-expansion-panel-content>
      <v-expansion-panel-content>
        <div slot="header">Private Key</div>
        <v-card>
          <v-card-text class="cb-warning-text">
            This is not a recommended way to use access your wallet. Use with caution.
          </v-card-text>
          <v-card-text>
            <v-textarea v-model="privateKey" outline solo auto-grow label="Enter your private key">
            </v-textarea>
            <v-flex class="text-xs-center">
              <v-btn large color="primary" :loading="privateKeyWalletLoading" :disabled="privateKeyWalletLoading || privateKey.length <= 0"
                v-on:click="connectUsingPrivateKey">Unlock Wallet</v-btn>
            </v-flex>
          </v-card-text>
          <v-card-text v-if="privateKeyWalletError.length > 0" class="cb-error-text">{{ privateKeyWalletError }}</v-card-text>
          </v-card-text>
        </v-card>
      </v-expansion-panel-content>
      <v-expansion-panel-content>
        <div slot="header">Ledger Wallet</div>
        <v-card>
          <v-card-text>
            <v-alert :value="true" type="info">
              Support for Ledger Wallet is not available at the moment. But will be available in the near future.
            </v-alert>
          </v-card-text>
        </v-card>
      </v-expansion-panel-content>
      <v-expansion-panel-content>
        <div slot="header">TREZOR</div>
        <v-card>
          <v-card-text>
            <v-alert :value="true" type="info">
              Support for TREZOR hardware wallets is not available at the moment. But will be available in the near
              future.
            </v-alert>
          </v-card-text>
        </v-card>
      </v-expansion-panel-content>
    </v-expansion-panel>
    <v-dialog max-width="500" v-model="newWalletDialog" persistent>
      <v-card>
        <v-card-title class="headline" primary-title>Keep your keystore file safe</v-card-title>
        <v-card-text>Your wallet has been generated with the address <strong>{{ newWalletAddress }}</strong>.</v-card-text>
        <v-card-text>Download the keystore file and store it in a safe place. You'll need the <strong>keystore file</strong>
          and <strong>password</strong>, you entered while creating, to access your wallet.</v-card-text>
        <v-divider></v-divider>
        <v-card-text>
          <v-checkbox v-model="newWalletCheckbox" label="I understand the risks and will download and store the keystore file in a secure place."></v-checkbox>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" :disabled="!newWalletCheckbox" flat :href="newWalletKeystoreLink" :download="newWalletDownloadFileName"
            @click="newWalletDialog = false">Download Keystore File</v-btn>
          <v-spacer></v-spacer>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-flex>
</template>
<script>
  import EWalletTypes from '@/enums/wallet-types';
  import FileInput from '@/components/FileInput.vue';
  import { WALLET_NAMESPACE } from '@/core/constants'
  import { CONNECT_WALLET, DISCONNECT_WALLET } from '@/store/action-types';

  export default {
    name: 'UnlockWallet',
    components: {
      FileInput
    },
    data() {
      return {
        softwareWalletError: '',
        softwareWalletLoading: false,

        privateKeyWalletError: '',
        privateKeyWalletLoading: false,
        privateKey: '',

        keystoreFormData: null,
        keystoreFile: '',
        keystoreWalletError: '',
        keystoreWalletLoading: false,
        keystorePassphrase: '',

        newWalletError: '',
        newWalletLoading: false,
        newWalletPassphrase: '',
        newWalletDialog: false,
        newWalletAddress: '',
        newWalletKeystoreLink: '',
        newWalletDownloadFileName: '',
        newWalletCheckbox: false
      }
    },
    computed: {
      isWalletConnected() { return this.$store.state[WALLET_NAMESPACE].isConnected; },
      wallet() { return this.$store.state[WALLET_NAMESPACE].current; }
    },
    methods: {
      createNewKeystore() {
        this.newWalletError = '';
        this.newWalletLoading = true;
        this.$store.dispatch(CONNECT_WALLET, {
          type: EWalletTypes.NewKeystore,
          passphrase: this.newWalletPassphrase
        })
          .then((wallet) => {
            this.newWalletDownloadFileName = `${wallet.address}.json`;
            const fileContents = JSON.stringify(wallet.keystore);

            this.newWalletKeystoreLink = 'data:text/plain;charset=utf-8,' + encodeURIComponent(fileContents);
            this.newWalletCheckbox = false;
            this.newWalletDialog = true;
          })
          .catch((err) => {
            this.newWalletError = err.message;
          })
          .then((_) => {
            this.newWalletLoading = false;
          });
      },
      connectSoftwareWallet() {
        this.softwareWalletError = '';
        this.softwareWalletLoading = true;
        this.$store.dispatch(CONNECT_WALLET, {
          type: EWalletTypes.SoftwareWallet
        })
          .catch((err) => {
            this.softwareWalletError = err.message;
          })
          .then((_) => {
            this.softwareWalletLoading = false;
          });
      },
      connectUsingPrivateKey() {
        this.privateKeyWalletError = '';
        this.privateKeyWalletLoading = true;
        this.$store.dispatch(CONNECT_WALLET, {
          type: EWalletTypes.PrivateKey,
          privateKey: this.privateKey.trim()
        })
          .then((_) => {
            this.privateKey = '';
          })
          .catch((err) => {
            this.privateKeyWalletError = err.message;
          })
          .then((_) => {
            this.privateKeyWalletLoading = false;
          });
      },
      unlockWithKeystoreFile() {
        this.keystoreWalletError = '';
        this.keystoreWalletLoading = true;
        this.$store.dispatch(CONNECT_WALLET, {
          type: EWalletTypes.KeystoreFile,
          keystoreFile: this.keystoreFormData,
          passphrase: this.keystorePassphrase
        })
          .catch((err) => {
            this.keystoreWalletError = err.message;
          })
          .then((_) => {
            this.keystoreWalletLoading = false;
          });
      },
      changeWallet() {
        this.$store.dispatch(DISCONNECT_WALLET);
      },
      keystoreFileChanged(formData) {
        this.keystoreFormData = formData[0].get('data');
      },
      keystoreFileCleared(formData) {
        this.keystoreFormData = null;
      }
    }
  }
</script>

<style lang="scss" scoped>
  .v-expansion-panel--popout {
    .v-expansion-panel__container {
      max-width: 100%;

      .header__icon {
        display: none;
      }

      &.v-expansion-panel__container--active {
        &:first-child {
          margin-top: 0;
        }

        &:last-child {
          margin-bottom: 0;
        }
      }
    }
  }
</style>