angular.module('starter')
.controller('DashCtrl', DashCtrl);

var bus = {};  // an Object

function DashCtrl($scope, $rootScope,$http,$timeout,
                  $ionicLoading, $ionicModal, $ionicListDelegate) {

  $scope.$on('$ionicView.enter', function() {
    init();
  });

  function init() {
    console.log("init()");

    $ionicLoading.show({
      template: "<p>Fetching data...</p><ion-spinner icon='lines'></ion-spinner>"
    });

    $.connection.hub.logging = true;
    $.connection.hub.url = "https://push-api.tfl.gov.uk/signalr/hubs/signalr";

    var hub = $.connection.predictionsRoomHub;
    hub.client.showPredictions = updateBoard;

    console.log("connection start..");
    $.connection.hub.start()
      .done(function() {
        console.log("tfl.predictions: connection started");

        $scope.status = "";
        $scope.dataAvailable = true;

        var lineRooms = [{
          "NaptanId": "490004377E"
        }];

        hub.server.addLineRooms(lineRooms)
          .done(function() {
            console.log("tfl.predictions: Invocation of addLineRooms succeeded");
            return;
          })
          .fail(function(error) {
            $ionicLoading.hide();
            console.log("tfl.predictions: Invocation of addLineRooms failed. Error: " + error);
            return;
          });

      });
    }

    function updateBoard(data) {
      $ionicLoading.hide();

      $.each(data, function(index, prediction) {
        //console.log(prediction);
        var key = prediction.LineName + ":" + prediction.VehicleId;
        var due = getDue(prediction.TimeToStation);

        var updatesReceived=0;
        var hasAlarm=false;
        var nextAlarm=0;
        var knowThisBus = bus[key];
        if ( knowThisBus ) {
          updatesReceived = bus[key].updatesReceived  + 1;
          hasAlarm = bus[key].hasAlarm;
          nextAlarm = bus[key].nextAlarm;

          if ( nextAlarm >=   getDue(prediction.TimeToStation)  ) {
            console.log("alarm has gone off, we can delete this alarm");
            hasAlarm = false;
            nextAlarm = 0;
          }
          console.log("We have this bus :" + key + " due :" + due + " updatesReceived=" + updatesReceived + " hasAlarm=" + hasAlarm);
        } else {
          console.log("Nice, new bus : " + key + " due :" + due);
          updatesReceived = 1;
          hasAlarm = false
        }

        // track this Bus
        bus[key] = {
            "lineName" : prediction.LineName,
            "vehicleId" : prediction.VehicleId,
            "destinationName" : prediction.DestinationName,
            "timeToStation" : prediction.TimeToStation,
            "expectedArrival" : prediction.ExpectedArrival,
            "towards" : prediction.Towards,
            "due": getDueInMinutes(prediction.TimeToStation),
            "updatesReceived" : updatesReceived,
            "hasAlarm" : hasAlarm,
            "nextAlarm" : nextAlarm
        };
        //console.log(busArrivals[key]);
      });

      //console.log(bus);

      var busArrivals = [];
      var currentTime = new moment();
      var x=0;

      //console.log("Check which Buses have left. Time now=" + currentTime.format("D-MM-YYYY HH:mm:ss") );

      for (var key in bus) {
        var busExpArrival = new moment(bus[key].expectedArrival);

        // check if Bus has left
        var diff = currentTime.diff(busExpArrival, 'seconds');

        if ( diff > 30 ) {
          //console.log("Bus has left " + diff + " seconds ago. Delete from our Tracker bus=" + key);
          delete bus[key];
        } else {
          busArrivals[x++] = bus[key];
        }
      }

      busArrivals.sort(sortByTts);

      //console.log(busArrivals);

      $timeout(
        function() {
          $scope.dataAvailable = true;
          $scope.status = "";
          $scope.stationName = data[0].StationName;
          $scope.currentTime = data[0].Timestamp;
          $scope.arrivals = busArrivals;
        },10);

      return true;
    };


    function getDue(timeToStation) {
      var mins = Math.floor(timeToStation / 60);
      return mins;
    }

    function getDueInMinutes(timeToStation) {
       return formatDueInMinutes( getDue(timeToStation) );
    }

    function formatDueInMinutes(mins) {
      var dueInMinutes = mins === 0 ? "Due" : mins + "m";
      return dueInMinutes;
    }


    function sortByTts(a, b) {
      return ((a.timeToStation < b.timeToStation) ? -1 : ((a.timeToStation > b.timeToStation) ? 1 : 0));
    };

    $scope.openAlarmModal = function(arrival) {

      $scope.busArrival = arrival;
      var mins = getDue(arrival.timeToStation);
      $scope.busArrival.dueInMinutes = mins;
      console.log("Due in mins=" +   $scope.busArrival.dueInMinutes);


      if ( arrival.hasAlarm==false) {
        console.log("-->No alarm, set a default for user to pick");
        if ( mins >= 5) {
          $scope.busArrival.nextAlarm = 5;
        }
        else {
            $scope.busArrival.nextAlarm = 0;  // due soon
        }
      } else {
          console.log("there's an existing alarm = " + arrival.nextAlarm);
      }

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

    $scope.$on('$destroy', function () {
      $scope.modal.remove();
    });

}
