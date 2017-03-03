/**
 * Created by neo on 2016/8/1.
 */
var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
var should = chai.should();
const _ = require('lodash');
var dbHandlerFactory = require('./dbHandlerFactory');

describe('test orm', function () {
    // it('test create service', function () {
    //     pool.getConnection().then(
    //         function (connection) {
    //             var service1 = new UserCopyTaskService(connection);
    //         }
    //     );
    // })
    // it('test get handler', function () {
    //     return dbhf.getHandler().should.eventually.be.instanceOf(DBHandler);
    // });
    // it('test get one', function () {
    //     return dbhf.getHandler().then(
    //         function (handler) {
    //             return handler.get(UserCopyTask, 3758);
    //         }
    //     ).then(function (model) {
    //         if (_.isBoolean(model)) {
    //             model.should.eq(false);
    //         } else {
    //             model.should.be.instanceOf(UserCopyTask);
    //             model.id.should.be.eq(3758);
    //         }
    //
    //     })
    // });
    // it('save userTaskCopyData', function () {
    //     return dbhf.getHandler().then(
    //         function (handler) {
    //             var dd = new UserCopyTaskData();
    //             return handler.save(dd);
    //         })
    // });
    // it('test get all', function () {
    //     return dbhf.getHandler().then(
    //         function (handler) {
    //             return handler.find('UserCopyTask', 10);
    //         }
    //     ).then(function(model) {
    //         model.should.be.instanceOf(UserCopyTask);
    //         model.id.should.be.eq(10);
    //     })
    // })
    // var model = new UserCopyTask();
    // model.visitor_nick = 'user 1';
    // model.source_url = 'http://www.foo.com';
    // it('test insert',function() {
    //     return dbhf.getHandler().then(
    //         /**
    //          *
    //          * @param handler{DBHandler}
    //          */
    //         function (handler) {
    //           return handler.insert(model);
    //         }
    //     ).then(function(savedModel) {
    //         savedModel.should.be.eq(model);
    //         savedModel.id.should.be.greaterThan(1);
    //     });
    // })
    // it('test update',function() {
    //     model.visitor_id = '12345';
    //     return dbhf.getHandler().then(
    //         /**
    //          *
    //          * @param handler{DBHandler}
    //          */
    //         function(handler) {
    //            return handler.update(model);
    //         }
    //     ).then(function(affected) {
    //         affected.should.be.eq(1);
    //     });
    // });
    // it('test count',function() {
    //     model.visitor_id = '12345';
    //     return dbhf.getHandler().then(
    //         /**
    //          *
    //          * @param handler{DBHandler}
    //          */
    //         function(handler) {
    //            return handler.count(UserCopyTask,[{id:['>',0]}]);
    //         }
    //     ).then(function(count) {
    //        console.log(count)
    //     })
    // })
    it('test get all', function () {
        return dbhf.getHandler().then(
            /**
             *
             * @param handler{DBHandler}
             */
            function (handler) {
                return handler.createQuery().from('UserCopyTask').where({task_state_code:'end'}).selectPage(1,'visitor_nick,source_url,task_state_code');
            }
        ).then(function (count) {
            console.log(count)
        }).catch(function () {

        })
    })
});