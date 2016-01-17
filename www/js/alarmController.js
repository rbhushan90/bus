angular.module('starter')
.controller('AlarmCtrl', function($scope, $rootScope, $document, $timeout,$cordovaLocalNotification) {


  // remember , this is a MODAL not VIEW !!
  $scope.$on('modal.shown', function() {
      console.log("modal shown");
  });

  $scope.hideAlarmModal = function() {
      $rootScope.alarmModal.hide();
  }

  $scope.toggleAlarm = function() {
    var newAlarm=null;

    if ( $scope.busArrival.hasAlarm ) {
      newAlarm = false;  // switch it off
      $scope.clockMode = "img/clock-static.gif";
      console.log("Delete the alarm");
    } else {
      newAlarm = true;
      $scope.clockMode = "img/clock-animated.gif";
      console.log("setAlarm() for num minutes before arrival = " + $scope.busArrival.nextAlarm);

      var expArrival = new Date(  $scope.busArrival.expectedArrival);
      var expArrivalTime = expArrival.getTime();

      var mins_before_arrival = expArrivalTime - ( $scope.busArrival.nextAlarm * 60 * 1000);

      var alarm = new Date(mins_before_arrival);
    }
    var data = $scope.arrivals;
    data.forEach(function (arrival, index) {
        if ( arrival.vehicleId == $scope.busArrival.vehicleId) {
          data[index].hasAlarm = newAlarm;
          console.log("found vehicle " +  $scope.busArrival.vehicleId);
        }
        //console.log(arrival); // logs "3", "5", "7"
    });
    $scope.arrivals = data;

  }


  $scope.setAlarm_CORDOVA = function(arrival) {
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


});
