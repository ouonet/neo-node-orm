'use strict';

function DBSchemaTable() {
    /**
     * @type {String}
     * table name
     */
    this.name = null;
    /**
     * @type pk{Array|String}
     *  primary key
     */
    this.pk = [];
    /**
     * @type {DBSchemaColumn[]}
     *  map model's field to table's column
     */
    this.columns = {};
    /**
     * @type {Array}
     *  map table columns to model's field
     */
    this.fields = {};

    /**
     * @type {function}
     * class of model
     */
    this.clazz = null;

    /**
     *
     * @type string
     */
    this.assign = null;

    this.assignFunc = null;

}

DBSchemaTable.prototype.getFieldNameByPropName=function(propName){
    if(this.columns.hasOwnProperty(propName)&& this.columns[propName].name!=undefined){
        return this.columns[propName].name;
    }else{
        return propName;
    }
};

module.exports = DBSchemaTable;