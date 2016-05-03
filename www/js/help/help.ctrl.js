angular.module('msze.help', [
])

.controller('HelpCtrl', function ($scope) {
    $scope.churchIcon = "img/logo3.png";
    $scope.church2Icon = "img/logo4.png";

    // TODO: move to service
    // $scope.weekday = function () {
        // var day = new Date();
        // var days = ["Niedziela", "Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek", "Sobota"];
        // return days[day.getDay()];
    // };

    // $scope.showTime = function () {
        // var hours = $scope.time.getHours();
        // var minutes = $scope.time.getMinutes();
        // if (hours < 10) { hours = "0"+hours; }
        // if (minutes < 10) { minutes = "0"+minutes; }

        // return hours+":"+minutes;
    // };
});
