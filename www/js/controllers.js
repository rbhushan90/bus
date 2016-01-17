angular.module('starter')

.controller('ChatsCtrl', function($scope, $http,$timeout, $rootScope,
                $document, $ionicModal, $ionicListDelegate) {

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
                    data[x].hasAlarm = false;  //no alarm has been set
                }
                data.sort(sortByTts);

                //console.log("sorted");
                //console.log(data);

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

    $scope.openAlarmModal = function(arrival) {
      console.log("----> open Alarm Modal");
    
      if ( arrival.hasAlarm==true ) {
        console.log("there's an existing alarm = " + arrival.nextAlarm);
      }

      $scope.busArrival = arrival;
      var mins = getDueNumberOnly(arrival.timeToStation);
      $scope.busArrival.dueInMinutes = mins;

      if ( arrival.hasAlarm==false) {
        console.log("-->No alarm, set a default for user to pick");
        if ( mins >= 5) {
          $scope.busArrival.nextAlarm = 5;
        }
        else {
          if ( mins <= 1)
            $scope.busArrival.nextAlarm = 0;  // due any minute now
          else
            $scope.busArrival.nextAlarm = 2;
        }
      }

      //console.log("due in=" + $scope.busArrival.dueInMinutes + " nextAlarm = " + $scope.busArrival.nextAlarm);

      //angular Knob
      $scope.options = {
          width: 200,
          height: 200,
          //thickness: .2,
          fgColor: "#ff0000",
          rotation : "anticlockwise",
          step : 1,
          min : 0,
          max: $scope.busArrival.dueInMinutes
      }

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

    $scope.$on('$destroy', function () {
      $scope.modal.remove();
    });
});
