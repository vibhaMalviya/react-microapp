module.exports = (api) => {
    api.cache.using(() => process.env.NODE_ENV)
    return {
        // babelrcRoots: [
        //     // Keep the root as a root
        //     ".",
        // ],
        // rootMode: 'root',
        presets: [
            ['@babel/preset-react', { development: true }],
            [
                '@babel/preset-env',
                {
                    modules: false,
                    bugfixes: true,
                    useBuiltIns: false,
                },
            ],
        ],
        plugins: [
            '@babel/plugin-proposal-class-properties',
            '@babel/plugin-syntax-dynamic-import',
            '@babel/plugin-proposal-optional-chaining',
        ],
        env: {
            test: {
                presets: [
                    ['@babel/preset-react', { runtime: 'automatic', development: true }],
                    [
                        '@babel/preset-env',
                        {
                            modules: 'commonjs',
                        },
                    ],
                ],
            },
            production: {
                presets: [
                    ['@babel/preset-react', { development: false }],
                ],
            },
            development: {
                presets: [
                    ['@babel/preset-react', { development: true }],
                ],
                plugins: [
                    'react-refresh/babel',
                ],
            },
        },
    };
};
