import IWallet from '@/interfaces/IWallet';
import connectWallet from '@/utils/connect-wallet';
import { CONNECT, DISCONNECT, USER_PAIR_ORDERS_GETTER } from '@/store/action-types';
import { COMMIT_CONNECT_WALLET, COMMIT_DISCONNECT_WALLET } from '@/store/mutation-types';

interface IWalletState {
  current: IWallet | null
  isConnected: boolean
}

const state: IWalletState = {
  isConnected: false,
  current: null
}

const actions = {
  async [CONNECT]({ commit, dispatch, rootGetters }, args) {
    return new Promise(async (resolve, reject) => {
      try {
        const wallet = await connectWallet(args);
        commit(COMMIT_CONNECT_WALLET, wallet);
        resolve(wallet);
      } catch (err) {
        commit(COMMIT_DISCONNECT_WALLET);
        reject(err);
      }
    });
  },
  [DISCONNECT]({ commit }) {
    commit(COMMIT_DISCONNECT_WALLET);
  },
}

const mutations = {
  [COMMIT_CONNECT_WALLET] (state: IWalletState, wallet: IWallet) {
    state.isConnected = true;
    state.current = wallet;
  },
  [COMMIT_DISCONNECT_WALLET] (state: IWalletState) {
    state.isConnected = false;
    state.current = null;
  },
}

const getters = {}

export default {
  namespaced: true,
  actions,
  mutations,
  getters,
  state
}