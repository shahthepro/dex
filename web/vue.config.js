module.exports = {
    pages: {
        exchange: {
            entry: 'src/exchange/main.ts',
            template: 'public/index.html',
            filename: 'index.html'
        },
        bridge: {
            entry: 'src/bridge/main.ts',
            template: 'public/bridge/index.html',
            filename: 'bridge/index.html'
        }
    }
}