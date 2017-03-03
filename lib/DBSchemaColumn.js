'use strict';
var _ = require('lodash');
function DBSchemaColumn() {
    /**
     * (Optional) The name of the column. Defaults to
     * the property or field name.\
     * @type {String}
     */
    this.name = null;
    this.isId = false;
    this.insertable = true;
    this.insertForce = null;
    this.default = null;
    this.updatable = true;
    this.updateForce = null;
    this.nullable = true;

    /**
     * (Optional) The SQL fragment that is used when
     * generating the DDL for the column.
     * <p> Defaults to the generated SQL to create a
     * column of the inferred type.
     */
    this.columnDefinition = "";
    /**
     * @var string $type
     *  value can be int , float ,decimal,string,datetime,binary ,default is string
     */
    this.type = "string";
    /**
     * (Optional) The column length. (Applies only if a
     * string-valued column is used.)
     */
    this.length = 255;
    /**
     * (Optional) The precision for a decimal (exact numeric)
     * column. (Applies only if a decimal column is used.)
     * Value must be set by developer if used when generating
     * the DDL for the column.
     */
    this.precision = 0;
    /**
     * (Optional) The scale for a decimal (exact numeric) column.
     * (Applies only if a decimal column is used.)
     */
    this.scale = 0;

    this.serializer = null;
}
DBSchemaColumn.prototype.clone = function (src) {
    return this.serializer && this.serializer.clone ? this.serializer.clone(src) : _.clone(src);
};
DBSchemaColumn.prototype.isEqual = function (value, other) {
    return this.serializer && this.serializer.isEqual ? this.serializer.isEqual(value, other) : value == other;
};
DBSchemaColumn.prototype.serialize = function (value) {
    var result = this.serializer ? this.serializer.serialize(value) : value;
    if (result === undefined) {
        result = null;
    }
    return result;
};
DBSchemaColumn.prototype.unSerialize = function (value) {
    return this.serializer ? this.serializer.unSerialize(value) : value;


};
module.exports = DBSchemaColumn;