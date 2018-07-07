/*
 * @Author: zy9@github.com/zy410419243 
 * @Date: 2018-05-20 13:48:08 
 * @Last Modified by: zy9
 * @Last Modified time: 2018-07-06 17:08:36
 */
const webpack = require('webpack');
const fs = require('fs');
const CleanWebpackPlugin = require('clean-webpack-plugin');
// const WebpackOnBuildPlugin = require('on-build-webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const TohoLogPlugin = require('toho-log-plugin');
const path = require('path');
const { logInfo, commonModule, commonPlugin, log, onCompile } = require('./webpack.common');

const buildPath = __dirname + '/dist/';
const dev = process.argv.includes('development') ? true : false;

let plugins = commonPlugin;

plugins.push(
    new CopyWebpackPlugin([
        {
            from: __dirname + '/src/assets',
            to: __dirname + '/dist/assets'
        },
        {
            from: __dirname + '/src/data',
            to: __dirname + '/dist/data'
        },
    ])
);

plugins.push(new TohoLogPlugin({ dev }));

!dev && plugins.push(new CleanWebpackPlugin(['dist'], {
    verbose: false
}));

const options = {
    mode: dev ? 'development' : 'production',
    // watch: dev,
    devServer: {
        port: 9099
    },
    externals: {
        'react': 'react',
        'react-dom': 'react-dom'
    },
    resolve: {
        extensions: ['.js', '.jsx'],
    },
    // devtool: dev ? 'source-map' : '',
    devtool: 'source-map',
    entry: {
        // main: __dirname + '/src',
        List_Container: __dirname + '/src/component/List_Container'
    },
    output: {
        path: __dirname + '/dist',
        filename: '[name]/index.js',
        chunkFilename: dev ? 'vendor/[name].[chunkHash:8].js' : 'vendor/[name].js',
        libraryTarget: 'umd'
    },
    plugins,
    module: commonModule
}

// dev && webpack(options).watch({}, () => {});

// !dev && webpack(options).run();
webpack(options).run();