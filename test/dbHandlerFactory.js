/**
 * Created by neo on 2016/8/7.
 */
var DBHandlerFactory = require('../lib/DBHandlerFactory');
var modelDefines = require('./modelDefines');
var dbConfig = {
    debug: false,
    dataSource: {
        connectionLimit: 10, //important
        host: 'localhost',
        user: 'root',
        password: 'jjjjjj',
        database: 'test',
        debug: false
    },
    models: modelDefines
};
var dbHandlerFactory = new DBHandlerFactory();
dbHandlerFactory.addORMConfigure(dbConfig);
module.exports = dbHandlerFactory;