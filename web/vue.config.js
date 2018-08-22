const CompressionWebpackPlugin = require('compression-webpack-plugin');

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
    },
    configureWebpack: {
        plugins: [
            new CompressionWebpackPlugin({
                asset: '[path].gz[query]',
                algorithm: 'gzip',
                test: new RegExp('\\.(js|css)$'),
                threshold: 10240,
                minRatio: 0.8
            })
        ]
    }
}