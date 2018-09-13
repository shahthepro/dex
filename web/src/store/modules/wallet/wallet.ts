import IWallet from '@/interfaces/iwallet';

interface IWalletState {
  current: IWallet | null
  isWalletConnected: boolean
}

const state: IWalletState = {
  isWalletConnected: false,
  current: null
}

const actions = {}

const mutations = {}

const getters = {}

export default {
  namespaced: true,
  actions,
  mutations,
  getters,
  state
}