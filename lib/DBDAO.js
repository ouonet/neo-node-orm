'use strict';
var _ = require('lodash');
/**
 *
 * @param dbh {DBHandler}
 * @param modelClazz {DBSchemaTable}
 * @constructor
 */
function DBDAO(dbh, modelClazz) {
    /**
     * @type {DBHandler}
     */
    this.dbh = dbh;
    /**
     * @type {DBSchemaTable}
     */
    this.modelClazz = modelClazz;
}
DBDAO.prototype = {
    /**
     * @param id
     * @return object
     * @throws \neo\orm\DBException
     */
    get: function (id) {
        if (!(_.isNumber(id) || _.isString(id) || _.isArray(id))) {
            throw new DBException('id is illegal');
        }
        return this.dbh.get(this.modelClazz, id);
    },
    count: function (where) {
        return this.dbh.count(this.modelClazz, where);
    }

    /**
     * @param model{Object}
     * @return {Object}
     * @throws \neo\orm\DBException
     */
    ,
    refresh: function (model) {
        return this.dbh.refresh(this.modelClazz, model);
    }

    /**
     * @param  model {Object}
     * @return int
     * @throws \neo\orm\DBException
     */
    ,
    save: function (model) {
        return this.dbh.save(this.modelClazz, model);
    }

    /**
     * @param model {Object}
     * @return int 1 if success ,false if fail
     * @throws \neo\orm\DBException
     */
    ,
    insert: function (model) {
        return this.dbh.insert(this.modelClazz, model);
    }

    /**
     * @param model {Object}
     * @param where {null|Array|Number|String}
     * @return {int}
     * @throws {DBException}
     */
    ,
    update: function (model, where = null) {
        return this.dbh.update(this.modelClazz, model, where);
    }

    /**
     * @param modelOrwhere {Object|Number}
     * @return {int}
     * @throws {DBException}
     */
    ,
    delete: function (modelOrwhere) {
        if (_.isObject(modelOrwhere)) {
            return this.dbh.delete(modelOrwhere);
        } else {
            return this.dbh.delete(this.modelClazz, modelOrwhere);
        }
    }

    /**
     * @param isCached {Boolean}
     * @return DBQuery
     */
    ,
    createQuery: function (isCached = true) {
        return this.dbh.createQuery(isCached).from(this.modelClazz);
    }
};