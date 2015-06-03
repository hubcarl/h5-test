var app = angular.module('chat', ['ngSanitize']);

app.filter('contentUrlFormat', function () {
  return function (content) {
    try{
      var json = JSON.parse(content);
      return json.url;
    }catch(e){
      return content;
    }
  }
});

app.filter('contentThumbFormat', function () {
  return function (content) {
    try{
      var json = JSON.parse(content);
      return json.thumb;
    }catch(e){
      return content;
    }
  }
});

// 默认是json格式
//app.config(function($httpProvider) {
//  $httpProvider.defaults.headers.put['Content-Type'] = 'application/x-www-form-urlencoded';
//});

app.controller('chatController', ['$scope', '$timeout', '$http', function ($scope, $timeout, $http) {

  function getURLParameters(url, name) {
    var params = {};
    url.replace(/[?&]+([^=&]+)=([^&#]*)/gi, function(m, key, value) {
      params[key] = decodeURIComponent(value);
    });
    return name ? params[name] : params;
  }

  function formatDate(obj, format) {
    var date = obj || new Date();
    if (obj && obj.toString !== '[object Date]') {
      if (isNaN(obj)) {
        date = new Date(obj);
      } else {
        date = new Date();
        date.setTime(obj);
      }
    }

    format = format || "yyyy-MM-dd hh:mm:ss";

    var o = {
      "M+": date.getMonth() + 1, //month
      "d+": date.getDate(),    //day
      "h+": date.getHours(),   //hour
      "m+": date.getMinutes(), //minute
      "s+": date.getSeconds(), //second
      "q+": Math.floor((date.getMonth() + 3) / 3),  //quarter
      "S": date.getMilliseconds() //millisecond
    };
    if (/(y+)/.test(format)) {
      format = format.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
    }
    for (var k in o) {
      if (new RegExp("(" + k + ")").test(format)) {
        format = format.replace(RegExp.$1, RegExp.$1.length == 1 ? o[k] : ("00" + o[k]).substr(("" + o[k]).length));
      }
    }
    return format;
  }

  var isSending = false;
  var pageIndex = 1;
  var pageSize = 10;

  $scope.special = getURLParameters(window.location.href, 'special') || "706069811";
  $scope.normal = getURLParameters(window.location.href, 'normal') || "706071010";
  $scope.isLoading = false;
  $scope.chatMsgList=[];

  $scope.chat = {
    inputMsg: '',
    customMsg: ''
  };

  $scope.request = function (url, params, callback) {
    var serverUrl = "http://xxx/" + url;
    $http.post(serverUrl, params, {headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'},
      transformRequest: function (data) {
        return $.param(data);
      }
    }).success(function (response, status, headers, config) {
      console.log('>>>request success[' + serverUrl + ']:', response);
      callback(response.success, response.data);
    }).error(function (response, status, headers, config) {
      console.log('>>>request failed[' + serverUrl + ']:', response);
      callback(false, response.data);
    });
  }

  // 消息记录
  $scope.loadChatMessage = function (callback) {

    if ($scope.isLoading)return;
    $scope.isLoading = true;

    var lastSendTime = "";
    if (pageIndex>1&&$scope.chatMsgList && $scope.chatMsgList.length > 0) {
      lastSendTime = $scope.chatMsgList[0].sendTime;
    }

    var params = {
      special: $scope.special,
      normal: $scope.normal,
      lastSendTime: lastSendTime,
      pageNum: pageIndex,
      pageSize: pageSize
    };

    $scope.request('sky/chat/detail', params, function (isSuccess, data) {
      $scope.isLoading = false;
      //TODO 加载完处理
      if (isSuccess) {
        if(pageIndex==1){
          $scope.chatMsgList=[];
        }
        console.log($scope.chatMsgList);
        $scope.chatMsgList = (data || []).concat($scope.chatMsgList || []);
        $scope.hasNextPage = (data || []).length>=pageSize;

        pageIndex++;
      }else{
        $scope.loadFailed = true;
        $timeout(function () {
          $scope.loadFailed = false;
        },5000);
      }
      if (callback) {
        callback(isSuccess);
      }
    });
  }

  // 刷新消息列表
  $scope.refresh = function () {
    pageIndex = 1;
    $scope.isReqTip = "正在刷新...";
    $scope.loadChatMessage(function (isSuccess) {
      $scope.isReqTip = isSuccess ? "刷新成功~~" : "刷新失败~~";
      $timeout(function () {
        $scope.isReqTip = undefined;
      }, 3000);
      scrollBottom();
    });
  }

  //加载自定义消息列表
  $scope.loadCustomMsgList = function () {
    var params = {
      special: $scope.special
    };
    $scope.request('sky/chat/list', params, function (isSuccess, data) {
      if (isSuccess) {
        $scope.customMsgList = data;
      }
    });
  }

  $scope.enterEvent = function ($event) {
    console.log('>>>>>', $event.keyCode);
    if ($event.keyCode == 13) {
      $scope.sendMsg();
      return true;
    }
  }

  //消息发送
  $scope.sendMsg = function () {
    var message = $scope.chat.inputMsg ? $scope.chat.inputMsg : $scope.chat.customMsg;
    if (message) {
      if (isSending)return;
      isSending = true;
      var params = {
        special: $scope.special,
        normal: $scope.normal,
        contentType: 1,
        optType: 0,
        content: message
      };
      $scope.tipMsg = undefined;
      $scope.request('sky/chat', params, function (isSuccess, data) {
        isSending = false;
        if (isSuccess) {
          $scope.chatMsgList.push(buildMessage(message));
          $scope.chat.inputMsg = "";
          $scope.chat.customMsg = "";
          scrollBottom();
        } else {
          $scope.tipMsg = "消息发送失败,请重新发送~~";
        }
      });
    } else {
      $scope.tipMsg = "请输入消息内容或者选择快速回复内容!";
      $timeout(function () {
        $scope.tipMsg = undefined;
      }, 3000);
    }
  }

  $scope.initMark = function () {
    var params = {
      special: $scope.special,
      normal: $scope.normal
    };
    $scope.request('sky/chat/mark', params, function (isSuccess, data) {
      $scope.isMark = (data==1);
    });
  }

  // 标记
  $scope.mark = function () {
    $scope.isReqTip = "正在提交...";
    var params = {
      special: $scope.special,
      normal: $scope.normal,
      markType: $scope.isMark ? 0 : 1
    };
    $scope.request('sky/chat/mark/update', params, function (isSuccess, data) {
      if (isSuccess) {
        $scope.isReqTip = $scope.isMark ? "取消标记成功" : "标记成功";
        $scope.isMark = !$scope.isMark;
      } else {
        $scope.isReqTip = $scope.isMark ? "取消标记失败" : "标记失败";
      }
      $timeout(function () {
        $scope.isReqTip = undefined;
      }, 3000);
    });
  }


  $scope.loadChatMessage(function(isSuccess){
    scrollBottom();
  });

  $scope.loadCustomMsgList();

  $scope.initMark();


  $scope.close = function (){

  }

  function buildMessage(message) {

    var messageObj = {
      special: $scope.special,
      specialName: "官方账号:" + $scope.special,
      specialIcon: "images/logo.png",
      normal: $scope.normal,
      normalName: "用户:" + $scope.normal,
      normalIcon: "images/default_pic.png",
      content: message,
      contentType: 1,
      optType: 0,
      sendTime: formatDate(new Date())
    };

    console.log('>>>>len' + $scope.chatMsgList.length);
    var len = $scope.chatMsgList && $scope.chatMsgList.length;
    if (len > 0) {
      for (var i = 0; i < len; i++) {
        var item = $scope.chatMsgList[i];
        if ($scope.special == item.special) {
          messageObj.specialName = item.specialName;
          messageObj.specialIcon = item.specialIcon;
          messageObj.normalName = item.normalName;
          messageObj.normalIcon = item.normalIcon;
          break;
        }
      }
    }
    console.log(messageObj);
    return messageObj;
  }

  function scrollTop() {
    setTimeout(function () {
      var chatDiv = document.getElementById('chatDiv');
      chatDiv.scrollTop = 0;
    }, 300);
  }

  function scrollBottom() {
    setTimeout(function () {
      var chatDiv = document.getElementById('chatDiv');
      chatDiv.scrollTop = chatDiv.scrollHeight;
    }, 300);
  }

}]);
