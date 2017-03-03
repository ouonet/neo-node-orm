'use strict';
var Promise = require('bluebird');
var mysql = require('mysql2');
Promise.promisifyAll(mysql);
Promise.promisifyAll(require("mysql2/lib/connection").prototype);
Promise.promisifyAll(require("mysql2/lib/pool").prototype);
var DBHandler = require('./DBHandler');
var DBException = require('./DBException');
var DBSchemaFactory = require('./DBSchemaFactory');

var DEFAULT_NAME = 'default';
var KEY_CACHE_DIR = 'cacheDir';
var KEY_MODULES = 'models';
var KEY_DEBUG = 'debug';
var KEY_DATASOURCE = 'dataSource';

var pools = [];

function DBHandlerFactory() {

    this.config = [];
    return this;
}
DBHandlerFactory.prototype = {
    /**
     * @return mixed
     */
    getConfig: function () {
        return this.config;
    },

    /**
     * @param $config
     */
    addORMConfigure: function ($config, $name) {
        $name = $name || $config['name'] || DEFAULT_NAME;
        this.config[$name] = $config;
        return this;
    },


    /**
     * @param $name{String|null}
     * @throws DBException
     * @return {Promise}
     */
    getHandler: function ($name) {
        $name = $name || DEFAULT_NAME;
        if (this.config[$name] != undefined) {
            var $config = this.config[$name];
        } else {
            throw new DBException("no " + $name + " configure for create DBhandler");
        }
        try {
            if (pools[$name] == undefined) {
                var connection = mysql.createPool($config[KEY_DATASOURCE]);
                Promise.promisifyAll(connection);
                pools[$name] = connection;
            }
            var pool = pools[$name];
            return pool.getConnectionAsync().then(
                function (connection) {
                    var dbh = new DBHandler(connection);
                    dbh.setDebug($config[KEY_DEBUG]);
                    dbh.schemaFactory = new DBSchemaFactory();
                    dbh.schemaFactory.define($config[KEY_MODULES]);
                    return dbh;
                }
            );
        } catch ($e) {
            throw new DBException('fail to create DBhandler cause by:' + $e.message);
        }
    }
};

module.exports = DBHandlerFactory;
