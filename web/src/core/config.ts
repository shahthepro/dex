let state = {
	APP_SERVER_URL: ''
}

const CONFIG = {
	loadFromEnv (env) {
		state.APP_SERVER_URL = env.VUE_APP_DEX_APPSERVER_HOST
	},
	getAppServerHost (): string {
		return state.APP_SERVER_URL
	},
}

export default CONFIG