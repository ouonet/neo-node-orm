'use strict';
/**
 * Class DBDao
 * @package neo\orm
 * provide basic database CRUD operation
 */
var logger = require('log4js').getLogger('orm');
var sprintf = require("sprintf-js").sprintf;
var Promise = require('bluebird');
var _ = require('lodash');
var HashTable = require('./HashTable');
var DBException = require('./DBException');
var DBQuery = require('./DBQuery');

var INSERT_INTO_FMT = "INSERT INTO `%s` \n(%s) \nVALUES (%s)";
var UPDATE_FMT = "UPDATE `%s` 、\nSET %s \nWHERE %s";
var DELETE_FMT = "DELETE FROM `%s` \nWHERE %s";
var CREATE_FMT = "CREATE TABLE %s (%s) CHARSET=%s";
var SELECT_ONE_FMT = "SELECT * \nFROM `%s` \nWHERE %s \nlimit 1";
var COUNT_FMT = "SELECT count(*) cc \nFROM `%s` \nWHERE %s";

function DBHandler(connection) {
    this.connection = connection;
    this.debug = false;

    this._cachedModels = new HashTable();
    /**
     * @var array
     * cache for PDOStatement ,key is sql string
     */
    this._stmCach = [];

    /**
     *
     * @type {Array}
     * @private
     */
    this._modelState = [];
    /**
     * todo
     * @var DBSchemaFactory schemaFactory
     */
    this.schemaFactory = null;

    return this;
}
DBHandler.prototype = {

    /**
     * @return boolean
     */
    isDebug: function () {
        return this.debug;
    },

    /**
     * @param boolean debug
     */
    setDebug: function (debug) {
        this.debug = debug;
    },
    /**
     * @return DBSchemaFactory
     */
    getSchemaFactory: function () {
        return this.schemaFactory;
    },

    /**
     * @param DBSchemaFactory schemaFactory
     */
    setSchemaFactory: function (schemaFactory) {
        this.schemaFactory = schemaFactory;
    },

    /**
     * @param model
     * @param schema{DBSchemaTable}
     * @return Object
     */
    _cloneModel: function (model, schema) {
//        schema = this.schemaFactory.getSchema(model);
        var cloned = {};
        for (var fieldName in  schema.columns) {
            var columnDef = schema.columns[fieldName];
            if (model.hasOwnProperty(fieldName)) {
                // cloned[fieldName] = model[fieldName];
                cloned[fieldName] = columnDef.clone(model[fieldName]);
            }
        }
        return cloned;
    },

    _doCacheModel: function (model, schema) {
        this._cachedModels.put(model, this._cloneModel(model, schema));
    },

    persist: function (model) {
        return this.save(model);
    },

    /**
     * @param clazz {String} name of model
     * @param model {Object}an Object of Model or array('modelName'=>'xxx',data=>object of Object)
     * @return int
     * @throws DBException
     * todo add support to object of Object
     */
    save: function (clazz, model) {
        if (model == undefined && _.isObject(clazz) && !_.isFunction(clazz)) {
            model = clazz;
        }
        if (model == undefined) {
            throw new DBException("model not assgin for save clazz");
        }
        if (this._cachedModels.get(model) !== undefined) {
            return this.update(model);
        }
        //todo 需要根据schema判断一下
        if (model.id !== undefined) {
            return this.update(clazz, model);
        }
        return this.insert(clazz, model);
    }
    ,

    /**
     * Insert a model to table ,usage:
     *    p= new Person();
     *    p.name='clever';
     *    insert(p);
     * or
     *    object= {};
     *    object.name = 'clever';
     *    insert('Person',object);
     * @param  clazz{Object|String} specify a model or class name,if class name is given, model must be given
     * @param  model{Object}  specify a model
     * @return {Promise}
     */
    insert: function (clazz, model) {
        if (model == undefined && _.isObject(clazz) && !_.isFunction(clazz)) {
            model = clazz;
        }
        if (model == null) {
            throw new DBException("no model assign to insert clazz ");
        }
        var schema = this.schemaFactory.getSchema(clazz);
        var pkColumn = schema.pk;
        //先判断要插入的字段
        var insertColumns = [];
        var insertValues = [];
        var insertParams = [];
        for (var fieldName in schema.columns) {
            var columnDef = schema.columns[fieldName];
            //可插入才进行下一步
            /* @var column DBSchemaColumn */
            var columnName = columnDef.name;
            if (columnDef.insertable) {
                if (columnDef.insertForce != null) {
                    //强制插入
                    insertColumns.push('`' + columnName + '`');
                    insertValues.push(columnDef.insertForce);
                } else if ((!model.hasOwnProperty(fieldName) || model[fieldName] === undefined ) && columnDef.default != null) {
                    //值为空，插入默认值
                    insertColumns.push('`' + columnName + '`');
                    insertValues.push(columnDef.default);
                }
                else if (model.hasOwnProperty(fieldName) && model[fieldName] !== undefined) {
                    //有值才插入
                    insertColumns.push('`' + columnName + '`');
                    insertValues.push('?');
                    var fieldValue = columnDef.serialize(model[fieldName]);
                    insertParams.push(fieldValue);
                    // insertValues.push(':' + columnName);
                    // insertParams[columnName] = model[fieldName];
                }
            }
        }
        var tableName = schema.name;
        var insertSQL = sprintf(INSERT_INTO_FMT, tableName, insertColumns.join(","), insertValues.join(","));
        var _this = this;
        return this.doExecute(insertSQL, insertParams).then(
            function (stm) {
                if (stm.affectedRows == 1) {
                    var pk0Name = pkColumn[0];
                    if (schema.columns[pk0Name].isId) {
                        model[pk0Name] = stm.insertId;
                    }
                    _this._doCacheModel(model, schema);
                } else {
                    throw new DBException("insert model tableName failed");
                }
                return model;
            }
        );
    },

    /**
     * update a model to table,usage:
     *      p=new Person();
     *      p.id=1;
     *      p.name = xxx;
     *      update(p);
     *  or  object= {};
     *      object.id=1;
     *      object.name=xxx;
     *      update('Person',object)
     *  or  object = {};
     *      object.name=xxx;
     *      object.age=10;
     *     update('Person',object,array(id=>10))
     * @param clazz
     * @param model specify a model
     * @param where [optional] could be a string ,or an id or an array of condition
     * @return {Promise}  modified rows
     */
    update: function (clazz, model, where) {
        if (model == undefined && _.isObject(clazz) && !_.isFunction(clazz)) {
            model = clazz;
        }
        if (model == null) {
            throw new DBException("no model assign to update clazz ");
        }
        var schema = this.schemaFactory.getSchema(clazz);
        //先判断要插入的字段
        var updateColumns = [];
        var updateParams = [];
        if (this._cachedModels.get(model) !== undefined) {
            //has cached model, compared with cached model, then only update columns which is modified
            var orginal = this._cachedModels.get(model);

            for (var fieldName in schema.columns) {
                var columnDef = schema.columns[fieldName]
                /* @var column DBSchemaColumn */
                var columnName = columnDef.name;
                if (columnDef.updatable) {
                    //可更新
                    if (columnDef.updateForce != null) {
                        //强制更新
                        updateColumns.push('`' + columnName + '`=' + columnDef.updateForce);
                    } else if (model.hasOwnProperty(fieldName) && !columnDef.isEqual(model[fieldName], orginal[fieldName])) {
                        //有值不同才更新
//                        updateColumns.push('`' . columnName . '`=:' . columnName);
//                        updateParams[':' . columnName] = model[fieldName];
                        updateColumns.push('`' + columnName + '`=?');
                        var fieldValue = columnDef.serialize(model[fieldName]);
                        updateParams.push(fieldValue);
                    }
                }
            }
        } else {
            for (var fieldName in schema.columns) {
                var columnDef = schema.columns[fieldName];
                /* @var column DBSchemaColumn */
                var columnName = columnDef.name;
                if (columnDef.updatable) {
                    //可更新
                    if (columnDef.updateForce != null) {
                        //强制更新
                        updateColumns.push('`' + columnName + '`=' + columnDef.updateForce);
                    } else if (model.hasOwnProperty(fieldName) && model[fieldName] !== undefined) {
                        //键值存在就更新
                        updateColumns.push('`' + columnName + '`=?');
                        var fieldValue = columnDef.serialize(model[fieldName]);
                        updateParams.push(fieldValue);
                    }
                }
            }
        }
        //没有更新的内容，返回
        if (_.isEmpty(updateColumns)) {
            return 0;
        }
        var whereStr = this.buildWhere(schema, model, where, updateParams);
        var updateSQL = sprintf(UPDATE_FMT, schema.name, updateColumns.join(","), whereStr);
        var _this = this;
        return this.doExecute(updateSQL, updateParams).then(
            function (stm) {
                _this._doCacheModel(model, schema);
                return stm.affectedRows;
            }
        );
    }
    ,

    /**
     * delete a model from table,usage:
     *      delete('Person',1);
     *   or
     *      delete('Person',array('id'=>1,'owner'=>'tom')
     *   or p=new Person();
     *      p.id=1;
     *      delete(p)
     * @param clazzOrModel {object||String}
     * @param where {Array}
     * @return {Promise}
     * @throws DBException
     */
    delete: function (clazzOrModel, where) {
        if ((_.isString(clazzOrModel) || _.isFunction(clazzOrModel)) && where == null) {
            //not allowed to delete all records
            throw new DBException("no condition for delete clazzOrModel ");
        }
        var schema = this.schemaFactory.getSchema(clazzOrModel);
        var deleteParams = [];
        var whereStr;
        if (_.isObject(clazzOrModel)) {
            //如果对象没有ID值，表明没有存储过，不需要删除
            if (!this.checkPersisted(schema, clazzOrModel)) {
                return Promise.resolve(true);
            }
            whereStr = this.buildWhere(schema, clazzOrModel, null, deleteParams);
        } else {
            whereStr = this.buildWhere(schema, clazzOrModel, where, deleteParams);
        }
        var deleteSQL = sprintf(DELETE_FMT, schema.name, whereStr);
        return this.doExecute(deleteSQL, deleteParams).then(
            function (stm) {
                return stm.affectedRows;
            }
        );
    },
    /**
     * check whether model is persisted
     * @param model
     * @param schema
     * @returns {boolean}
     */
    checkPersisted: function (schema, model) {
        for (var key in schema.pk) {
            var pkColumn = schema.pk[key];
            if (model[pkColumn] == null) {
                return false;
            }
        }
        return true;
    },

    /**
     * @param clazz string|int|array clazz if string or int, then means select by id , if array,each key is column
     * @param id
     * @return Object
     * @throws {DBException}
     */
    get: function (clazz, id) {
        var schema = this.schemaFactory.getSchema(clazz);
        var selectParams = [];
        var whereStr = this.buildWhere(schema, null, id, selectParams);
        if (_.isEmpty(whereStr)) {
            throw new DBException('missing where cause in findOne');
        }
        var selectSQL = sprintf(SELECT_ONE_FMT, schema.name, whereStr);
        var _this = this;
        return this.doQuery(selectSQL, selectParams).then(
            function (stm) {
                var model = _this.doFectchOne(stm, schema);
                return model;
            }
        );
    },

    count: function (clazz, where) {
        var schema = this.schemaFactory.getSchema(clazz);
        var selectParams = [];
        var whereStr = this.buildWhere(schema, null, where, selectParams);
        if (_.isEmpty(whereStr)) {
            throw new DBException('missing where cause in count');
        }
        var selectSQL = sprintf(COUNT_FMT, schema.name, whereStr);
        return this.doQuery(selectSQL, selectParams).then(
            function (stm) {
                if (stm.length == 0) {
                    throw new DBException('fail to get count ,unkonw reason');
                }
                return stm[0].cc;
            }
        );
    },

    refresh: function (clazz, model) {
        var schema = this.schemaFactory.getSchema(clazz);
        var selectParams = [];
        var whereStr = this.buildWhere(schema, model, null, selectParams);
        if (_.isEmpty(whereStr)) {
            throw new DBException('missing where cause in findOne');
        }
        var selectSQL = sprintf(SELECT_ONE_FMT, schema.name, whereStr);
        var stm = this.doQuery(selectSQL, selectParams);
        model = this.doFectchOne(stm, schema, true, model);
        return model;
    }
    ,

    /**
     * @param schema
     * @param model
     * @param where
     * @param columns
     * @param params
     * @throws DBException
     */

    buildWhere: function (schema, model, where, params) {
        if (where == null) {
            if (model == null) {
                throw new DBException(' fail to build where sql');
            }
            var columns = [];
            for (var key in schema.pk) {
                var pkColumn = schema.pk[key];
                if (model[pkColumn] != null) {
                    columns.push('`' + schema.columns[pkColumn].name + '`=?');
                    params.push(model[pkColumn]);
                } else {
                    throw new DBException('primay key has not assigned');
                }
            }
            return columns.join(' and ');
        } else {
            return DBQuery.buildWhere(schema, where, params);
        }
    },

    /**
     * @param clazz
     * @param where
     * @return DBQuery
     */
    createQuery: function (isCache) {
        isCache = isCache == undefined ? true : isCache;
        var dbQuery = new DBQuery(isCache);
        dbQuery.setDbh(this);
        return dbQuery;
    },

    /**
     * @param strSql{String}
     * @param params{Array}
     * @return {Promise}
     */
    doExecute: function (strSql, params) {
        if (this.debug) {
            this.showSQL(strSql, params);
        }
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.connection.prepare(strSql, function (err, stm) {
                if (err) {
                    reject(err);
                    return;
                }
                stm.execute(params, function (err, rows, columns) {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve(rows);
                });
            })
        });
// if (this._stmCach[strSql] !== undefined) {
//     var stm = this._stmCach[strSql];
// } else {
//     var stm = this.prepare(strSql);
//     this._stmCach[strSql] = stm;
// }
// stm.execute(params);
// return stm;
    },

    /**
     * @param strSql
     * @param params
     * @return PDOStatement
     */
    doQuery: function (strSql, params) {
        // if (this.debug) {
        //     this.showSQL(strSql, params);
        // }
        // if (this._stmCach[strSql] !== undefined) {
        //     var stm = this._stmCach[strSql];
        // } else {
        //     var stm = this.prepare(strSql);
        //     stm.setFetchMode(PDO::FETCH_OBJ | PDO::FETCH_LAZY); //PDO::FETCH_OBJ for convience to get columns
        //     this._stmCach[strSql] = stm;
        // }
        // stm.execute(params);
        // return stm;
        return this.doExecute(strSql, params);
    },

    /**
     * 数据表内容映射到模型
     * @param schema{DBSchemaTable}
     * @param model{null|Object}
     * @param rec{null|Object}
     */
    assignIn: function (schema, model, rec) {
        if (schema == undefined) {
            _.assignIn(model, rec);
            return;
        }
        for (var columnName in rec) {
            var propName = schema.fields[columnName];
            if (propName == undefined) {
                model[columnName] = rec[columnName];//没定义的column,就直接用数据库字段名字作为对象的字段名字
                continue;
            }
            /**
             * @type {DBSchemaColumn}
             */
            var columnDef = schema.columns[propName];
            if (!columnDef) {
                throw new DBException(propName + 'is not defined in ' + schema.name);
            }
            if (rec.hasOwnProperty(columnDef.name)) {
                model[propName] = columnDef.unSerialize(rec[columnDef.name]);
            }
        }
    },
    /**
     * read from row , copy value to a new model
     * @param stm{Array}
     * @param schema{DBSchemaTable}
     * @param isCache{null|boolean}
     * @param model{null|Object}
     * @return {Object|boolean}
     */
    doFectchOne: function (stm, schema, isCache, model) {
        isCache = isCache == undefined ? true : isCache;
        // var row = stm.fetch();
        //
        if (!stm || stm.length < 1) {
            return null;
        }
        if (null == model) {
            if (schema != undefined) {
                var clazz = schema.clazz;
                model = new clazz();
            } else {
                model = {};
            }
        }
        var rec = stm.shift();
        this.assignIn(schema, model, rec);
        if (isCache) {
            this._doCacheModel(model, schema);
        }
        return model;
    },

    doFetchAll: function (stm, schema, isCache) {
        isCache = isCache == undefined ? true : isCache;
        var results = [];
        if (_.isEmpty(schema)) {
            return stm;
        } else {
            var obj = this.doFectchOne(stm, schema, isCache);
            while (obj) {
                results.push(obj);
                obj = this.doFectchOne(stm, schema, isCache);
            }
        }
        return results;
    }
    ,

    showSQL: function (strSql, params) {
        logger.trace(strSql, params);
    },
    release: function () {
        this.connection.release();
    }
}
;

module.exports = DBHandler;