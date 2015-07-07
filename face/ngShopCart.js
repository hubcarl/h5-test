/**
 *
 * 项目结构
 *   prototype 设计原型
 *     css
 *       ...user
 *       ...usercart
 *     images
 *       ...user
 *       ...usercart
 *   components  第三方组件
 *      angular
 *      bootstrap
 *   framework  应用框架 自己编写的公共组件
 *     mongoService.js
 *     utils.js
 *     ...
 *   modules  业务模块 或者 采用 model/view/controller  分模块，然后再分业务模块
 *    .......share  自定义公共业务ui组件
 *
 *    .......user
 *      .......login
 *        .........login.html
 *        .........login.js
 *
 *    .......usercart
 *      .......cartlist 购物车列表
 *        .........cartlist.html
 *        .........cartlist.js
 *
 *      .......cartprice 清单页面
 *        .........cartprice.html
 *        .........cartprice.js
 **/




var app = angular.module('shopCartApp',[]);


app.factory('MongoService',function() {

    var obj = {};

    var mongoose = require('mongoose');
    mongoose.connect('mongodb://localhost/shopCartApp');

    var Schema = mongoose.Schema;

    var shop = new Schema({
        shopId: String,
        count: Int,
        size: String,
        color: String,
        createTime: new Date()
    });


    obj.userShopModel = mongoose.model('user_shop_cart', shop);

    return obj;
});




app.factory('ShopService',['MongoService', function(MongoService){
    var obj ={};

    /**
     * 添加到购物车
     * @param shopItem
     */
    obj.addShopCartItem = function(shopItem, callback){

        var shopItem = new MongoService.userShopModel({
            shopId : shopItem.shopId,
            count: shopItem.count,
            size: shopItem.size,
            color: shopItem.color
        });

        shopItem.save(function(err,doc){
            callback(err,doc);
        });

    }

    /**
     * 从购物车中删除
     * @param shopItem
     */
    obj.deleteShopCartItem = function(shopItem,callback){
        MongoService.userShopModel.findByIdAndRemove(shopItem.shopId, function(err, docs) {
            callback(err,doc);
        });

    }

    //  获取购物车商品列表
    obj.getShopCartItems = function(userId,callback){
        MongoService.userShopModel.find({ userId: userId}, function (err, docs) {
            callback(err,docs);
        });
    }

    //获取用户购物清单
    obj.calculateShopPrice = function(shopItems){
        //TODO
    }


    return obj;

}]);

app.directive("shopItem",['ShopMongoDB',function(ShopMongoDB){
    return {
        scope: {
            shopInfo: '=shopInfo'
        },
        templateUrl: 'app/views/shop.html',
        controller: ['$scope', '$attrs',
            function ($scope, $attrs) {
                $scope.$watch('shopItem', function (newValue) {

                });

            }]
    };

}]);

app.controller('shopCartController',['$scope','ShopService', function($scope, ShopService){

     var userId;

     ShopService.getShopCartItems(userId, function(err,data){
         $scope.userShopItems =  data;
     });


}]);

