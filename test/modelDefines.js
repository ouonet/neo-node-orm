/**
 * Created by neo on 2016/8/2.
 */
var Employee = require('./model/Employee');
var _ = require('lodash');
var employeeSchema = [Employee, 'user_copy_task',
    {
        id: {isId: true, type: "int"},
        tm_create: {insertForce: "now()", updatable: false, type: "datetime"},
        tm_modify: {insertForce: "now()", updateForce: "now()", type: "datetime"},
        version: {insertForce: "1", updateForce: "version+1", type: "int"},
        deleted: {default: "0", type: "int"},
        name: {},
        age: {type: 'int'}
    }];

module.exports = [employeeSchema];