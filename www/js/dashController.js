angular.module('starter')
.controller('DashCtrl', DashCtrl);

var bus = {};  // an Object

function DashCtrl($scope, $rootScope, $timeout, $filter, $ionicLoading) {

  $.connection.hub.logging = true;
  $.connection.hub.url = "https://push-api.tfl.gov.uk/signalr/hubs/signalr";

  var hub = $.connection.predictionsRoomHub;
  hub.client.showPredictions = updateBoard;

  $.connection.hub.start()
    .done(function() {
      console.log("tfl.predictions: connection started");

      $scope.status = "";
      $scope.dataAvailable = true;

      $ionicLoading.show({
        template: "<p>Fetching data...</p><ion-spinner icon='lines'></ion-spinner>"
      });

      var lineRooms = [{
        "NaptanId": "490004377E"
      }];

      hub.server.addLineRooms(lineRooms)
        .done(function() {
          console.log("tfl.predictions: Invocation of addLineRooms succeeded");
          return;
        })
        .fail(function(error) {
          console.log("tfl.predictions: Invocation of addLineRooms failed. Error: " + error);
          return;
        });

    });

    function updateBoard(data) {

      $ionicLoading.hide();

      $.each(data, function(index, prediction) {
        //console.log(prediction);
        var key = prediction.LineName + ":" + prediction.VehicleId;
        var due = getDue(prediction.TimeToStation);

        var updatesReceived=0;
        var knowThisBus = bus[key];
        if ( knowThisBus ) {
          updatesReceived = bus[key].updatesReceived  + 1;
          console.log("We have this bus :" + key + " due :" + due + " updatesReceived=" + updatesReceived);
        } else {
          console.log("Nice, new bus : " + key + " due :" + due);
          updatesReceived = 1;
        }

        // track this Bus
        bus[key] = {
            "lineName" : prediction.LineName,
            "vehicleId" : prediction.VehicleId,
            "destinationName" : prediction.DestinationName,
            "timeToStation" : prediction.TimeToStation,
            "expectedArrival" : prediction.ExpectedArrival,
            "towards" : prediction.Towards,
            "due": due,
            "updatesReceived" : updatesReceived
        };
        //console.log(busArrivals[key]);
      });

      //console.log(bus);

      var busArrivals = [];
      var currentTime = new moment();
      var x=0;

      console.log("Check which Buses have left. Time now=" + currentTime.format("D-MM-YYYY HH:mm:ss") );

      for (var key in bus) {
        var busExpArrival = new moment(bus[key].expectedArrival);

        // check if Bus has left
        var diff = currentTime.diff(busExpArrival, 'seconds');

        if ( diff > 45 ) {
          console.log("Bus has left " + diff + " seconds ago. Delete from our Tracker bus=" + key);
          delete bus[key];
        } else {
          busArrivals[x++] = bus[key];
        }
      }

      busArrivals.sort(sortByTts);

      console.log(busArrivals);

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
      var dueInMinutes = mins === 0 ? "Due" : mins + "m";
      return dueInMinutes;
    }


    function sortByTts(a, b) {
      return ((a.timeToStation < b.timeToStation) ? -1 : ((a.timeToStation > b.timeToStation) ? 1 : 0));
    };

  
}
