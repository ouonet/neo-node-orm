var DBException = require('./DBException');
var DBSchemaTable = require('./DBSchemaTable');
var DBSchemaColumn = require('./DBSchemaColumn');
var regexp = /function\s*([^(]+)\(/;
function getClazzName(aClazz) {
    if (_.isFunction(aClazz)) {
        return aClazz.toString().match(regexp)[1];
    } else if (_.isObject(aClazz)) {
        return aClazz.constructor.toString().match(regexp)[1];
    }
    throw new TypeError('aClazz should be function or Object');
}

var _ = require('lodash');
/**
 *
 * @param clazz{function|object}
 * @param name{String}
 * @param columnDefs{Object}
 * @returns {DBSchemaTable}
 */
function defineOne(clazz, name, columnDefs) {
    var st = new DBSchemaTable();
    st.clazz = clazz;
    st.name = name;
    _(columnDefs).each(function (columnDef, propName) {
        var sc = new DBSchemaColumn();
        if (columnDef.name == undefined) {
            //column name is same as property name
            columnDef.name = propName;
        }
        _.assignIn(sc, columnDef);
        st.columns[propName] = sc;
        st.fields[sc.name] = propName;
        if (sc.isId) {
            sc.insertable = false;
            sc.updatable = false;
            st.pk.push(propName);
        }
    });
    return st;
}
function DBSchemaFactory() {
    this.caches = {};
    return this;
}
DBSchemaFactory.prototype = {
    define: function (clazz, tableName, options) {

        if (_.isArray(clazz)) {
            var _this = this;
            _.each(clazz, function (def) {
                if (def.length < 3) {
                    throw new DBException('define should have two parameters:name,option');
                }
                _this.define(def[0], def[1], def[2]);
            });
            return;
        }
        var clazzName = getClazzName(clazz);
        var obj = new clazz();
        var clazzNameOfObj = getClazzName(obj);
        if (clazzName != clazzNameOfObj) {
            throw new DBException(clazzName + ' define is illegal,to check whether the '+clazzName+'.prototype.constructor is '+clazzName);
        }
        this.caches[clazzName] = defineOne(clazz, tableName, options);
        return this;
    },
    getSchema: function (model) {
        var clazzName = model;
        if (_.isObject(model)) {
            clazzName = getClazzName(model);
        }
        if (this.caches[clazzName]) {
            return this.caches[clazzName];
        } else {
            throw new DBException('no schema');
        }
    }
};
module.exports = DBSchemaFactory;