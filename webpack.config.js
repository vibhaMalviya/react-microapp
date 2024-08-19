/* eslint-env node */
const path = require('path');
const sass = require('sass');
const webpack = require('webpack');

const HtmlWebpackPlugin = require('html-webpack-plugin');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

/* Change this for your microapp */
const appName = 'MicroapptemplateApp';
const appContainerId = `${appName}-container`;

module.exports = function config(env) {
    const isServe = env.WEBPACK_SERVE === true;
    const isProduction = env.production === true;
    const commonConfig = {
        target: 'web',
        mode: isProduction ? 'production' : 'development',
        devtool: isProduction ? 'nosources-source-map' : 'cheap-module-source-map',
        output: {
            path: path.resolve(__dirname, 'build'),
            publicPath: '/',
            chunkFilename: '[id].chunk.[chunkhash].js',
        },
        module: {
            rules: [
                {
                    test: /\.jsx?$/,
                    exclude: /node_modules/,
                    loader: 'babel-loader',
                },
                {
                    test: /\.(png|jpe?g|gif|svg)$/i,
                    type: 'asset/inline',
                },
                {
                    test: /\.s?css$/,
                    use: [
                        'style-loader',
                        {
                            loader: 'css-loader',
                            options: {
                                sourceMap: true,
                                modules: {
                                    localIdentName: '[hash:base64]',
                                },
                            },
                        },
                    ],
                },
                {
                    test: /\.jsx?$/,
                    enforce: 'pre',
                    include: [
                        /@dashx/,
                        /@opendns/,
                        /@magnetic/,
                        /@ciscodesignsystems/,
                    ],
                    exclude: [
                        /sse-polyfills/,
                        /@magnetic\/icons/,
                        /core-js/,
                    ],
                    use: ['source-map-loader'],
                },
            ],
        },
        resolve: {
            extensions: ['.js', '.jsx'],
        },
        externals: {
            react: 'React',
            'react-dom': 'ReactDOM',
            'react-router': 'ReactRouterDOM',
            'react-router-dom': 'ReactRouterDOM',
            'react/jsx-runtime': 'ReactJsxRuntime',
        },
        plugins: [
            !isProduction && isServe && new ReactRefreshWebpackPlugin(),
        ].filter(Boolean),
        optimization: {},
    };

    if (isProduction) {
        commonConfig.optimization = {
            splitChunks: {
                chunks: 'async',
            },
        };
    }

    // the main differences between the standalone and remote component
    // version are:
    //  * remote-component has @dashx/context as an external since it
    //      is provided by the dashboard/dashx
    //  * standalone should include polyfills in the index.jsx (also
    //      provided by the dashboard/dashx)
    //  * different entrypoints
    return [
        {
            ...commonConfig,
            name: 'standalone',
            entry: {
                polyfills: {
                    import: '@dashx/sse-polyfills',
                },
                index: {
                    dependOn: 'polyfills',
                    import: './src/entry/index.jsx',
                },
            },
            output: {
                ...commonConfig.output,
                filename: '[name].bundle.js',
            },
            plugins: [
                // new webpack.debug.ProfilingPlugin(),
                ...commonConfig.plugins,
                new HtmlWebpackPlugin({
                    template: 'src/entry/index.html',
                }),
                new webpack.DefinePlugin({
                    APIV3_ENDPOINT: JSON.stringify(process.env.APIV3_ENDPOINT),
                    APIV3_TOKEN: JSON.stringify(process.env.APIV3_TOKEN),
                    APIV3_KEY: JSON.stringify(process.env.APIV3_KEY),
                }),
                new CopyPlugin(
                    {
                        patterns: [
                            {
                                from: require.resolve('@magnetic/core/dist/cjs/style.css'),
                                to: './standalone-assets/css/magnetic/core.css',
                                // transform: (content) => sass.compileString(`#${appContainerId} {\n${content}\n}`).css,
                            },
                            {
                                from: require.resolve('@magnetic/globals/dist/cjs/style.css'),
                                to: './standalone-assets/css/magnetic/globals.css',
                                // transform: (content) => sass.compileString(`#${appContainerId} {\n${content}\n}`).css,
                            },
                        ],
                    },
                ),
            ],
            devServer: {
                hot: !isProduction,
                open: false,
                port: 3000,
                historyApiFallback: true,
                allowedHosts: 'all',
                static: ['standalone-assets'],
                client: {
                    overlay: false,
                    webSocketURL: {
                        hostname: 'localhost',
                    },
                },
                // if this is set to 'ws', firefox won't load the microapp through website
                // in dev mode
                webSocketServer: 'sockjs',
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods':
                        'GET, POST, PUT, DELETE, PATCH, OPTIONS',
                    'Access-Control-Allow-Headers':
                        'X-Requested-With, content-type, Authorization',
                    'x-amz-meta-dashx': true,
                },
            },
        },
        {
            ...commonConfig,
            name: 'remote-component',
            entry: './src/App.jsx',
            output: {
                ...commonConfig.output,
                filename: 'main.component.js',
                library: {
                    // NOTE: this name must match the value in the dashx manifest
                    // under microapps.<microappId>.componentName
                    name: appName,
                    type: 'window',
                },
            },
            externals: {
                ...commonConfig.externals,
                '@dashx/context': 'DashContextBundle',
            },
            plugins: [
                ...commonConfig.plugins],
        },
    ];
};

module.exports.parallelism = 2;
