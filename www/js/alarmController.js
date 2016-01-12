angular.module('starter')
.controller('AlarmCtrl', function($scope, $document, $timeout) {

  $scope.hideAlarmModal = function() {
    console.log("hide modal");
      $scope.alarmModal.hide();
  }

  $scope.setAlarm = function() {
    console.log("set Alarm");
    $scope.hideAlarmModal();
  }

  // remember , MODAL not VIEW !!
  $scope.$on('modal.shown', function() {
    console.log("modal shown, initKnob()");

    var value = $scope.busArrival.nextAlarm;
    var dataMax = $scope.busArrival.dueInMinutes;

    $document.find('.knob').attr('value', value).attr('data-max',dataMax);

    init();
  });



  // runs everytime this View is opened
  //$scope.init= function()  {
  function init() {

        console.log(">> afterEnter, initKnob()");
        $document.find('.knob').knob({
            change : function (value) {
                //console.log("change : " + value);
            },
            release : function (value) {
                //console.log(this.$.attr('value'));
                console.log("release : " + value);
            },
            cancel : function () {
                console.log("cancel : ", this);
            },
        });

  };

});
