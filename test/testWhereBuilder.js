/**
 * Created by neo on 2016/8/1.
 */
var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
chai.should();
var DBQuery = require('../lib/DBQuery');


describe('simple string', function () {
    it('string', function () {
        var params = [];
        var whereStr = DBQuery.buildWhere(null, "name=tom and age=18", params);
        whereStr.should.equal("name=tom and age=18");
        // params[0].should.equal('tom');
    });
});
describe('simple array', function () {
    it('no =', function () {
        var params = [];
        var whereStr = DBQuery.buildWhere(null, ['name', "tom"],  params);
        whereStr.should.equal("`name`= ?");
        params[0].should.equal('tom');
    });
    it('=', function () {
        var params = [];
        var whereStr = DBQuery.buildWhere(null, ['name', "tom"],  params);
        whereStr.should.equal("`name`= ?");
        params[0].should.equal('tom');
    });
    it('>', function () {
        var params = [];
        var whereStr = DBQuery.buildWhere(null, ['age', ">", "9"],  params);
        whereStr.should.equal("`age` > ?");
        params[0].should.equal('9');
    });
    it('<', function () {
        var params = [];
        var whereStr = DBQuery.buildWhere(null, ['age', "<", "9"],  params);
        whereStr.should.equal("`age` < ?");
        params[0].should.equal('9');
    });
    it('>=', function () {
        var params = [];
        var whereStr = DBQuery.buildWhere(null, ['age', ">=", "9"],  params);
        whereStr.should.equal("`age` >= ?");
        params[0].should.equal('9');
    });
    it('<=', function () {
        var params = [];
        var whereStr = DBQuery.buildWhere(null, ['age', "<=", "9"],  params);
        whereStr.should.equal("`age` <= ?");
        params[0].should.equal('9');
    });
    it('<>', function () {
        var params = [];
        var whereStr = DBQuery.buildWhere(null, ['age', "<>", "9"],  params);
        whereStr.should.equal("`age` <> ?");
        params[0].should.equal('9');
    });
    it('in', function () {
        var params = [];
        var whereStr = DBQuery.buildWhere(null, ['age', "in", "9", 10],  params);
        whereStr.should.equal("`age` in (?,?)");
        params[0].should.equal('9');
        params[1].should.equal(10);
    });
    it('in', function () {
        var params = [];
        var whereStr = DBQuery.buildWhere(null, ['age', "in", ["9", 10]],  params);
        whereStr.should.equal("`age` in (?,?)");
        params[0].should.equal('9');
        params[1].should.equal(10);
    });
    it('between', function () {
        var params = [];
        var whereStr = DBQuery.buildWhere(null, ['age', "between", ["9", 10]],  params);
        whereStr.should.equal("`age` between ? and ? ");
        params[0].should.equal('9');
        params[1].should.equal(10);
    });
    it('between', function () {
        var params = [];
        var whereStr = DBQuery.buildWhere(null, ['age', "between", "9", 10],  params);
        whereStr.should.equal("`age` between ? and ? ");
        params[0].should.equal('9');
        params[1].should.equal(10);
    });
    it('is null', function () {
        var params = [];
        var whereStr = DBQuery.buildWhere(null, ['age', "is null"],  params);
        whereStr.should.equal("`age` is null");
        params.length.should.equal(0);
    });
    it('is not null', function () {
        var params = [];
        var whereStr = DBQuery.buildWhere(null, ['age', "is not null"],  params);
        whereStr.should.equal("`age` is not null");
        params.length.should.equal(0);
    });
    it('like', function () {
        var params = [];
        var whereStr = DBQuery.buildWhere(null, ['name','like',"%tom%"],  params);
        whereStr.should.equal("`name` like ?");
        params[0].should.equal("%tom%");
    });
});
describe('simple object', function () {
    it('no =', function () {
        var params = [];
        var whereStr = DBQuery.buildWhere(null, {name: "tom"},  params);
        whereStr.should.equal("`name`= ?");
        params[0].should.equal('tom');
    });
    it('=', function () {
        var params = [];
        var whereStr = DBQuery.buildWhere(null, {name: "tom"},  params);
        whereStr.should.equal("`name`= ?");
        params[0].should.equal('tom');
    });
    it('>', function () {
        var params = [];
        var whereStr = DBQuery.buildWhere(null, {age: [">", "9"]},  params);
        whereStr.should.equal("`age` > ?");
        params[0].should.equal('9');
    });
    it('<', function () {
        var params = [];
        var whereStr = DBQuery.buildWhere(null, {age: ["<", "9"]},  params);
        whereStr.should.equal("`age` < ?");
        params[0].should.equal('9');
    });
    it('>=', function () {
        var params = [];
        var whereStr = DBQuery.buildWhere(null, {age: [">=", "9"]},  params);
        whereStr.should.equal("`age` >= ?");
        params[0].should.equal('9');
    });
    it('<=', function () {
        var params = [];
        var whereStr = DBQuery.buildWhere(null, {age: ["<=", "9"]},  params);
        whereStr.should.equal("`age` <= ?");
        params[0].should.equal('9');
    });
    it('<>', function () {
        var params = [];
        var whereStr = DBQuery.buildWhere(null, {age: ["<>", "9"]},  params);
        whereStr.should.equal("`age` <> ?");
        params[0].should.equal('9');
    });
    it('in', function () {
        var params = [];
        var whereStr = DBQuery.buildWhere(null, {age: ["in", "9", 10]},  params);
        whereStr.should.equal("`age` in (?,?)");
        params[0].should.equal('9');
        params[1].should.equal(10);
    });
    it('in', function () {
        var params = [];
        var whereStr = DBQuery.buildWhere(null, {age: ["in", ["9", 10]]},  params);
        whereStr.should.equal("`age` in (?,?)");
        params[0].should.equal('9');
        params[1].should.equal(10);
    });
    it('between', function () {
        var params = [];
        var whereStr = DBQuery.buildWhere(null, {age: ["between", ["9", 10]]},  params);
        whereStr.should.equal("`age` between ? and ? ");
        params[0].should.equal('9');
        params[1].should.equal(10);
    });
    it('between', function () {
        var params = [];
        var whereStr = DBQuery.buildWhere(null, {age: ["between", "9", 10]},  params);
        whereStr.should.equal("`age` between ? and ? ");
        params[0].should.equal('9');
        params[1].should.equal(10);
    });
    it('is null', function () {
        var params = [];
        var whereStr = DBQuery.buildWhere(null, {age: ["is null"]},  params);
        whereStr.should.equal("`age` is null");
        params.length.should.equal(0);
    });
    it('is not null', function () {
        var params = [];
        var whereStr = DBQuery.buildWhere(null, {age: ["is not null"]},  params);
        whereStr.should.equal("`age` is not null");
        params.length.should.equal(0);
    });
});
describe('multi key object', function () {
    it('implicate and', function () {
        var params = [];
        var whereStr = DBQuery.buildWhere(null, {age: ["is null"],'name':'tom'},  params);
        whereStr.should.equal("( `age` is null ) and ( `name`= ? )");
        params.length.should.equal(1);
        params[0].should.equal('tom');
    })
});
describe('logical', function () {
    it('implicate and', function () {
        var params = [];
        var whereStr = DBQuery.buildWhere(null, [{age: ["is null"]}, ['name', 'tom']], params);
        whereStr.should.equal("( `age` is null ) and ( `name`= ? )");
        params.length.should.equal(1);
        params[0].should.equal('tom');
    });
    it('explicit and', function () {
        var params = [];
        var whereStr = DBQuery.buildWhere(null, ['and', {age: ["is null"]}, ['name', 'tom']],  params);
        whereStr.should.equal("( `age` is null ) and ( `name`= ? )");
        params.length.should.equal(1);
        params[0].should.equal('tom');
    });
    it('or', function () {
        var params = [];
        var whereStr = DBQuery.buildWhere(null, ['or', {age: ["is null"]}, ['name', 'tom']],  params);
        whereStr.should.equal("( `age` is null ) or ( `name`= ? )");
        params.length.should.equal(1);
        params[0].should.equal('tom');
    });
    it('or of object', function () {
        var params = [];
        var whereStr = DBQuery.buildWhere(null, ['or',{age: ["is null"], 'name': 'tom'}],  params);
        whereStr.should.equal("( `age` is null ) or ( `name`= ? )");
        params.length.should.equal(1);
        params[0].should.equal('tom');
    });
    it('not', function () {
        var params = [];
        var whereStr = DBQuery.buildWhere(null, ['not', {age: ["is null"]}, ['name', 'tom']],  params);
        whereStr.should.equal("not ( ( `age` is null ) and ( `name`= ? ) )");
        params.length.should.equal(1);
        params[0].should.equal('tom');
    });
    it('not of object', function () {
        var params = [];
        var whereStr = DBQuery.buildWhere(null, ['not', {age: ["is null"], 'name': 'tom'}],  params);
        whereStr.should.equal("not ( ( `age` is null ) and ( `name`= ? ) )");
        params.length.should.equal(1);
        params[0].should.equal('tom');
    });
    it('not of object', function () {
        var params = [];
        var whereStr = DBQuery.buildWhere(null, ['not', {age: ["is null"], 'name': 'tom'}],  params);
        whereStr.should.equal("not ( ( `age` is null ) and ( `name`= ? ) )");
        params.length.should.equal(1);
        params[0].should.equal('tom');
    });
    it('a=? and (c=? or c=?) and k=dd', function () {
        var params = [];
        var whereStr = DBQuery.buildWhere(null, [['a','1'],['or',['c',2],["c",3]],'k=dd'],  params);
        whereStr.should.equal("( `a`= ? ) and ( ( `c`= ? ) or ( `c`= ? ) ) and ( k=dd )");
        params.length.should.equal(3);
        params[0].should.equal('1');
        params[1].should.equal(2);
        params[2].should.equal(3);
    });
});
describe('specify schema', function () {
    var DBSchemaFactory = require('../lib/DBSchemaFactory');
    var dbf = new DBSchemaFactory();
    dbf.define(Person, 'person', {
        id:{isId:true},
        createTime:{name:'create_time'},
        name:{},
        age:{}
    });
    function Person(){
        this.id = undefined;
        this.createTime = undefined;
        this.name = undefined;
        this.age = undefined;
        return this;
    }

    it('createTime translated to create_time', function () {
        var params = [];
        var whereStr = DBQuery.buildWhere(dbf.getSchema(Person),{createTime:'2016-08-19 20:18:17'} ,  params);
        whereStr.should.equal("`create_time`= ?");
        params.length.should.equal(1);
        params[0].should.equal('2016-08-19 20:18:17');
    });
});