angular.module('starter')

.controller('ChatsCtrl', function($scope, $http,$timeout, $rootScope,
    $cordovaLocalNotification, $document, $ionicModal, $ionicListDelegate) {

  var isAndroid= ionic.Platform.isWebView() && ionic.Platform.isAndroid();



  $scope.getData = function(lineNumber) {
        console.log("fetch data");
        //var url = "https://api.tfl.gov.uk/Line/285/Arrivals";
        var url = "https://api.tfl.gov.uk/Line/" + lineNumber + "/Arrivals";
        $scope.lineNumber = lineNumber;

        $http.get(url,
          { params: { "stopPointId": "490004377E" } })
            .success(function(data) {
              console.log("SUCCESS - got results back from TFL");
              console.log(data);

              if (data.length== 0 ) {
                  // clear old data

                  $timeout(
                    function() {
                      $scope.dataAvailable = false;
                      $scope.stationName = null;
                      $scope.arrivals = null;
                    },10);
              }
              else {
                for (x=0;x<data.length;x++) {
                    var due = getDue(data[x].timeToStation);
                    data[x].due = due;    // add another column for 'due'
                }
                data.sort(sortByTts);

                console.log("sorted");
                console.log(data);

                $timeout(
                  function() {
                    $scope.dataAvailable = true;
                    $scope.stationName = data[0].stationName;
                    $scope.arrivals = data;
                  },10);
              }
            })
            .error(function(data) {
                alert("ERROR");
            });
    }

    function getDue(timeToStation) {
      var mins = Math.floor(timeToStation / 60);
      var dueInMinutes = mins === 0 ? "Due" : mins + "m";
      return dueInMinutes;
    }


    function sortByTts(a, b) {
      return ((a.timeToStation < b.timeToStation) ? -1 : ((a.timeToStation > b.timeToStation) ? 1 : 0));
    };

    $scope.setAlarm_HTML = function(arrival) {
      console.log("setAlarm...");

      console.log("exp arrival = " +  arrival.expectedArrival);
      var expArrival = new Date(arrival.expectedArrival);

      console.log("expArrival = " + expArrival);
      var expArrivalTime = expArrival.getTime();
      console.log("expArrivalTime = " + expArrivalTime);
      var _5_mins_before_arrival = expArrivalTime - (5 * 60 * 1000);

      var alarm = new moment(_5_mins_before_arrival);
      console.log("alarm = " + alarm.format("HH:mm:ss"));

    }


    $scope.openAlarmModal = function(arrival) {
      console.log("open Alarm Modal");
      $ionicListDelegate.closeOptionButtons();

      $scope.busArrival = arrival;

      var mins = getDueNumberOnly(arrival.timeToStation);
      $scope.busArrival.dueInMinutes = mins;

      if (mins <= 5) {
        $scope.busArrival.nextAlarm = 2;
      } else {
        $scope.busArrival.nextAlarm = 5;
      }

      console.log("due in=" + $scope.busArrival.dueInMinutes + " nextAlarm = " + $scope.busArrival.nextAlarm);

      $ionicModal.fromTemplateUrl('templates/alarm.html', {
        scope: $scope
      }).then(function (modal) {
        $rootScope.alarmModal = modal;

        $rootScope.alarmModal.show();
      });

    }


      function getDueNumberOnly(timeToStation) {
        var mins = Math.floor(timeToStation / 60);
        return mins;
      }

    $scope.setAlarm = function(arrival) {
      console.log("setAlarm...");

      cordova.plugins.notification.local.hasPermission(function (granted) {
          if ( granted) {
            console.log("has permission");
          } else {
            console.log("App has NO permission");
            cordova.plugins.notification.local.registerPermission(function (granted) {
              console.log("register permission = " + granted);
            });
          }
      });

      console.log("exp arrival = " +  arrival.expectedArrival);
      var expArrival = arrival.expectedArrival.getTime();
      var _5_mins_before_arrival = new Date(expArrival - (5 * 60 * 1000));

      console.log("5 mins before = " + _5_mins_before_arrival);

      var sound = isAndroid ? 'file://audio/sound.mp3' : 'file://audio/beep.caf';

      $cordovaLocalNotification.schedule({
        id: 1,
        text: "The " + arrival.lineName + " Bus will be here in 5 minutes",
        sound: sound,
        at: _5_mins_before_arrival,
        data: { secret:"this is a secret" }
      });
    }

    $scope.$on('$destroy', function () {
      $scope.modal.remove();
    });
});
