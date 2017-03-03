'use strict';
var _ = require('lodash');
var DBException = require('./DBException');
var COMPARES = ['>', '<', '=', '>=', '<=', '<>', 'in', 'like', 'between', 'is null', 'is not null'];
var SINGLE_PARAM_OPERATORS = ['>', '<', '=', '>=', '<=', '<>', 'like'];
var LOGICAL_KEY = ['and', 'or', 'not'];
var DBSchemaTable = require('./DBSchemaTable');
var DBPageResult = require('./DBPageResult');
var intReg = /^\s*[\d]+\s*$/;
function isNumberLike(value) {
    return _.isNumber(value) || (_.isString(value) && intReg.test(value));
}
/**
 *
 * @param schema {DBSchemaTable}
 * @param where {int|String|Array|Object}
 *    1.id an int or number string
 *    2.string ,normal sql string, not recommend
 *    3.Array:
 *      3.1 arraySimpleExpression
 *          3.1.1 [column name,value]  ==> column=value
 *          3.1.2 [column name , operator,...value] => column operator value,refer to 4.2
 *      3.2 LogicalExpression
 *          3.2.1 ["and",whereExpression+]
 *          3.2.2 ["or",whereExpression+]
 *          3.2.3 ["not",whereExpression+]
 *      3.3 whereExpression[]
 *    4.Object:
 *      4.1 {column:value} , means column=value
 *      4.2 {column:[operation,...value)]}
 *           operation could be '>','<','=','>=','<=','<>','in','like','between','is null','is not null'
 *           4.2.1 ['>|<|>=|<=|=',val]
 *           4.2.2 ['in',val1,val2,val3],['in',[val1,val2,val3]]
 *           4.2.3 ['like','%'.val.'%']
 *           4.2.4 ['between,val1,val2] or ['between,[val1,val2]]
 *
 * @param params{Array}
 * @throws DBException
 * @return {String}
 */
function buildWhere(schema, where, params) {
    var whereColumn = [];
    if (!_.isEmpty(schema) && isNumberLike(where)) {
        // if got schema ,and where is only a integer param,means invoker want get Model by id.
        var pkColumns = schema.pk;
        if (pkColumns.length == 1) {
            var pkColumn = pkColumns[0];
            var pkColumnName = schema.columns[pkColumn].name;
            whereColumn.push(pkColumnName + '= ?');
            params.push(where);
        }
    } else buildComplexWhere(schema, where, whereColumn, params);
    return combineSubExpress(whereColumn, 'and');
}

function combineSubExpress(subWhereColumn, logicalOperator) {
    var subExprees;
    if (subWhereColumn.length > 1) {
        subExprees = '( ' + subWhereColumn.join(' ) ' + logicalOperator + ' ( ') + ' )';
    } else {
        subExprees = subWhereColumn.join(' ' + logicalOperator + ' ');
    }
    return subExprees;
}
function buildComplexWhere(schema, where, whereColumn, params) {
    if (_.isString(where)) {
        // if string where clause is ready
        whereColumn.push(where);
    } else if (_.isArray(where)) {
        // is single expression
        if (isSingleExpression(where)) {
            buildSingleExpression(schema, whereColumn, params, where);
            return;
        }
        var logicalOperator = 'and';
        if (isLogicalExpression(where)) {
            logicalOperator = where.shift().toLocaleLowerCase();
        }
        var subWhereColumn = [];
        _.each(where, function (whereExpression) {
            buildComplexWhere(schema, whereExpression, subWhereColumn, params)
        });
        switch (logicalOperator) {
            case 'and':
            case 'or':
                whereColumn.push(combineSubExpress(subWhereColumn, logicalOperator));
                break;
            case 'not':
                whereColumn.push('not ( ' + combineSubExpress(subWhereColumn, 'and') + ' )');
                break;
        }
    } else if (_.isObject(where)) {
        _.each(where, function (val, columnName) {
            var simpleExpression;
            if (_.isArray(val)) {
                simpleExpression = val.concat();
                simpleExpression.unshift(columnName);
            } else {
                simpleExpression = [columnName, val];
            }
            if (!isSingleExpression(simpleExpression)) {
                throw new DBException('not legal expression');
            }
            buildSingleExpression(schema, whereColumn, params, simpleExpression);
        })
    } else {
        throw new DBException('where condition is no legal');
    }
}
/**
 * 必须是Array,不少于2个，都是简单值
 * @param where
 * @returns {boolean}
 */
function isSingleExpression(where) {
    if (!_.isArray(where)) {
        return false;
    }
    if (where.length < 2) {
        return false;
    }
    if (!_.isString(where[0])) {
        return false;
    }
    if (_.includes(LOGICAL_KEY, where[0].toLowerCase())) {
        return false;
    }
    var mayOperation = _.filter(where, function (val) {
        return _.isString(val) || _.isNumber(val) || _.isBoolean(val);
    });
    var jj = _.intersection(COMPARES, mayOperation);
    return jj.length == 1 || (where.length == 2 && jj.length == 0);
}

function isLogicalExpression(where) {
    var w0 = where[0];
    return _.isString(w0) && _.includes(LOGICAL_KEY, w0);
}

/**
 *  @param schema{DBSchemaTable}
 * @param whereColumn{Array}
 *      3.1 [column name,value]  ==> column=value
 *      3.2 [column name , operator,...value] => column operator value
 * @param params{Array}
 * @param val {Array}
 * @throws DBException
 */
function buildSingleExpression(schema, whereColumn, params, val) {
    if (!_.isArray(val)) {
        throw new DBException('wrong parameter ,val should be Array');
    }
    var columnName = val.shift();
    if (schema instanceof DBSchemaTable) {
        columnName = schema.getFieldNameByPropName(columnName);
    }
    if (val.length == 0) {
        throw new DBException(columnName + " should have at least one value");
    }
    //[opcode,value]
    var opcode = val.shift();
    // eliminate redundancy space and transform to lower case
    var lowerOpCode = _.isString(opcode) ? opcode.replace(/\s+/g, ' ').toLowerCase() : "unknown";
    switch (lowerOpCode) {
        case 'is null':
        case 'is not null':
            whereColumn.push('`' + columnName + '` ' + lowerOpCode);
            break;
        case 'in':
            var flattenVal = _.flatten(val);
            var countOfVals = flattenVal.length;
            if (countOfVals == 0) {

            }
            whereColumn.push('`' + columnName + '` in (' + _.fill(new Array(countOfVals), '?').join(',') + ')');
            _.each(flattenVal, function (fval) {
                params.push(fval);
            });
            break;
        case 'between':
            flattenVal = _.flatten(val);
            countOfVals = flattenVal.length;
            if (countOfVals != 2) {
                throw new DBException('operation "BETWEEN" should have two value');
            }
            whereColumn.push('`' + columnName + '` between ? and ? ');
            params.push(flattenVal[0]);
            params.push(flattenVal[1]);
            break;
        default:
            if (!_.includes(SINGLE_PARAM_OPERATORS, lowerOpCode) && val.length == 0) {
                // [ column,value] => column=value
                whereColumn.push('`' + columnName + '`= ?');
                params.push(opcode);
            } else {
                whereColumn.push('`' + columnName + '` ' + lowerOpCode + ' ?');
                params.push(val[0]);
            }
            break;
    }
}

function DBQuery() {
    this.isCached = true;

    /**
     * @type {DBHandler}
     */
    this.dbh = null;
    // this._table = null;
    this._from = null;
    this._select = null;
    this._where = null;
    this._group = null;
    this._having = null;
    this._order = null;
    this._limit = null;
    this._page = null;
    this._pageSize = 20;
    this._params = [];
    this._schema = null;
}
DBQuery.prototype = {
    /**
     * @return int
     */
    getPageSize: function () {
        return this._pageSize;
    },

    /**
     * @param pageSize{int}
     * @return {DBQuery}
     */
    setPageSize: function (pageSize) {
        this._pageSize = pageSize;
        return this;
    },
    /**
     * @return {DBHandler}
     */
    getDbh: function () {
        return this.dbh;
    },


    /**
     * @param  dbh{DBHandler}
     * @return {DBQuery}
     */

    setDbh: function (dbh) {
        this.dbh = dbh;
        return this;
    },

    /**
     * @var DBSchemaTable
     */


    /**
     * when from is set , parse from string to get schema
     * if only one table ,schema is valid.
     * @param from
     * @throws DBException
     * @return {DBQuery}
     */
    from: function (from) {

        this._from = from;
        this._schema = null;//先清空schema
        if (this._from.indexOf(',') == -1) {
            //not include ',',means there is only one table in from clause.
            var f1 = this._from.trim().split(' ')[0];

            try {
                this._schema = this.dbh.getSchemaFactory().getSchema(f1);
            } catch (e) {
                // if not found schema , ignore exception.
                if (e.code != DBException.SCHEMA_NOT_FOUND) {
                    throw e;
                }
            }
        }

        return this;
    },

    /**
     * @param where{String|Object|Array}
     * @return {DBQuery}
     */

    where: function (where) {
        this._where = where;
        return this;
    },

    /**
     * @param group{String|Object|Array}
     * @return {DBQuery}
     */

    group: function (group) {
        this._group = group;
        return this;
    }


    /**
     * @param  having
     * @return {DBQuery}
     */
    ,
    having: function (having) {
        this._having = having;
        return this;

    },

    /**
     * @param order
     * @return {DBQuery}
     */

    order: function (order) {
        this._order = order;
        return this;

    },

    /**
     * @param countOrFrom{int}
     * @param count{int}
     * @return {DBQuery}
     */

    limit: function (countOrFrom, count) {
        count = count == undefined ? 0 : count;
        this._page = null;
        this._limit = [countOrFrom];
        if (count > 0) {
            this._limit.push(count);
        }
        return this;
    },

    /**
     * @param int page
     * @return {DBQuery}
     */

    page: function (page) {
        this._limit = null;
        var vp = page;
        this._page = vp > 0 ? vp : 1;
        return this;
    },

    /**
     * @param params
     * @return {DBQuery}
     */

    params: function (params) {
        this._params = params;
        return this;
    },

    /**
     * @param select{String}
     * @return {Array}
     */

    select: function (select) {

        this._select = select;
        var buildResult = this.buildSql();
        var _this = this;
        return this.dbh.doQuery(buildResult.selectSQL, buildResult.params).then(
            function (stm) {
                return _this.dbh.doFetchAll(stm, _this._schema, _this.isCached);
            }
        );
    },


    /**
     * @param select
     * @param page
     * @return {DBPageResult}
     */

    selectPage: function (page, select) {
        if (page == undefined && this._page == undefined) {
            return this.select(select);
        } else {
            if (page == undefined) {
                page = this._page;
            }
            this._limit = null;
            this._page = null;
            var _this = this;
            return this.count().then(
                function (count) {
                    var vp = parseInt(page);
                    _this._page = vp > 0 ? vp : 1;
                    return _this.select(select).then(
                        function (records) {
                            var result = new DBPageResult();
                            result.number = page;
                            result.size = _this._pageSize;
                            result.totalElements = count;
                            result.numberOfElements = records.length;
                            result.totalPages = Math.ceil(count / _this._pageSize);
                            result.rows = records;
                            return result;
                        }
                    );
                }
            );

        }
    },
    count: function () {
        var temp = this._select;
        this._select = ' count(*) as cc';
        var buildResult = this.buildSql();
        this._select = temp;
        return this.dbh.doQuery(buildResult.selectSQL, buildResult.params).then(
            function (stm) {
                var rec = stm[0];
                return parseInt(rec['cc']);
            }
        );

    },

    /**
     * @var DBSchemaTable
     * @return {Object} [selectSQL, params]
     */
    buildSql: function () {

        var sqls = ['select'];
        sqls.push(!_.isEmpty(this._select) ? this._select : '*');
        var params=_.clone(this._params);
        if (!_.isEmpty(this._from)) {
            // var tableName = this._from;
            sqls.push('\n from ' + this._schema.name);
            //where
            if (!_.isEmpty(this._where)) {
                // var whereColumn = [];
                // buildWhere(this._schema, this._where, whereColumn, this._params);
                //each condition will be joined by "and"
                sqls.push('\n where ' + buildWhere(this._schema, this._where, params));
            }
            if (!_.isEmpty(this._group)) {
                sqls.push('\n group by ' + this._group);
            }
            if (!_.isEmpty(this._having)) {
                sqls.push('\n having ' + this._having);
            }
            if (!_.isEmpty(this._order)) {
                sqls.push('\n order by ' + this._order);
            }
            if (this._page !== undefined && _.isNumber(this._page) && this._pageSize > 0
            ) {
                sqls.push('\n limit ' + this._pageSize * (this._page - 1) + ',' + this._pageSize);
            }
            else if (!_.isEmpty(this._limit)) {
                sqls.push('\n limit ' + this._limit.join(','));
            }
        }
        var selectSQL = sqls.join(' ');
        return {selectSQL: selectSQL, params: params};
    },
};
DBQuery.buildWhere = buildWhere;
module.exports = DBQuery;