import { TOKEN_PAIR_INFO } from '@/core/constants'

export const GET = 'GET'
export const SET = 'SET'
export const LOAD = 'LOAD'

// export const TOKENS_NAMESPACE = 'TOKENS'
// export const TOKEN_PAIRS_GETTER = 'GET_TOKEN_PAIRS'
// export const LOAD_TOKENS = `${TOKENS_NAMESPACE}/${LOAD}`
// export const GET_TOKENS = `${TOKENS_NAMESPACE}/${GET}`
// export const GET_TOKEN_PAIRS = `${TOKENS_NAMESPACE}/${TOKEN_PAIRS_GETTER}`

export const TOKEN_PAIR_SETTER = 'SET_TOKEN_PAIR'
export const SET_TOKEN_PAIR = `${TOKEN_PAIR_INFO}/${TOKEN_PAIR_SETTER}`