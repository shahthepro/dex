import CONFIG from './config'

const APIService = {
	getOHLCData (token: string, base: string) {
		let url = getAbsoluteEndpoint('trades/ohlc')
		url.searchParams.set('token', token)
		url.searchParams.set('base', base)
		return fetch(url.toJSON())
			.then(resp => resp.json())
	},
	getTradeHistory (token: string, base: string) {
		let url = getAbsoluteEndpoint('trades/history')
		url.searchParams.set('token', token)
		url.searchParams.set('base', base)
		return fetch(url.toJSON())
			.then(resp => resp.json())
	},
	getOrderbook (token: string, base: string) {
		let url = getAbsoluteEndpoint('orderbook')
		url.searchParams.set('token', token)
		url.searchParams.set('base', base)
		return fetch(url.toJSON())
			.then(resp => resp.json())
	},
}

function getAbsoluteEndpoint(endpoint: string): URL {
	return new URL(endpoint, CONFIG.getAppServerHost())
}

export default APIService