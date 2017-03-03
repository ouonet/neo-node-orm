var util = require('util');
function DBException(message) {
    this.name = 'DBException';
    // this.code = code;
    this.message = message || '';
    this.stack = (new Error()).stack;
    return this;
}
DBException.SCHEMA_NOT_FOUND = 100;
util.inherits(DBException, Error);
module.exports = DBException;


