angular.module('msze.settings', [
    'settings.service',
    'ionic',
    'ionic-timepicker',
])

.controller('SettingsCtrl', function ($scope, $rootScope, SettingsData) {

    //TODO sprawdzić czy na telefonie są dobre godziny (UTC)
    function isValidDate(d) {
        if ( Object.prototype.toString.call(d) !== "[object Date]" )
            return false;
        return !isNaN(d.getTime());
    };

    $scope.setBoundary = function (val) {
        SettingsData.setBoundary(val);
        var distance = 100000;
        if (val == false) distance = $scope.distance;
        console.log(distance);
        $rootScope.$emit('newDistance', distance);
    };

    $scope.setCurrentTime = function (val) {
        SettingsData.setCurrentTime(val);
        SettingsData.setTime(null);
        $rootScope.$emit('newTime', 0);
        $scope.time = new Date();
    };

    $scope.setDistance = function (val) {
        SettingsData.setDistance(val);
        $rootScope.$emit('newDistance', val);
    };

    $scope.showTime = function () {
        var hours = $scope.time.getHours();
        var minutes = $scope.time.getMinutes();
        if (hours < 10) { hours = "0"+hours; }
        if (minutes < 10) { minutes = "0"+minutes; }

        return hours+":"+minutes;
    };

    SettingsData.isBoundary()
    .then(function(isBoundary) {
        $scope.isBoundary = isBoundary;
    });

    SettingsData.isCurrentTime()
    .then(function(isCurrentTime) {
        $scope.isCurrentTime = isCurrentTime;
    });

    SettingsData.getDistance()
    .then(function(distance) {
        $scope.distance = distance;
    });

    SettingsData.getTime()
    .then(function(time) {
        var hr = time;
        if (hr == null) $scope.time = new Date();
        else $scope.time = new Date(hr);
        $scope.timePickerObject = {
            inputEpochTime: ($scope.time.getHours() * 60 * 60),  //Optional
            step: 15,  //Optional
            format: 24,  //Optional
            titleLabel: 'Wybierz godzinę',  //Optional
            setLabel: 'Akceptuj',  //Optional
            closeLabel: 'Anuluj',  //Optional
            setButtonType: 'button-positive',  //Optional
            closeButtonType: 'button-stable',  //Optional
            callback: function (val) {    //Mandatory
                timePickerCallback(val);
            }
        };
    });

    function timePickerCallback(val) {
        if (typeof (val) === 'undefined') {
            console.log('Time not selected');
        } else {
            $scope.time = new Date();
            val /= 60;
            var hrs = Math.floor(val / 60);
            var minutes = (val % 60);
            $scope.time.setHours(hrs, minutes, 0, 0);

            SettingsData.setTime($scope.time);
            SettingsData.setCurrentTime(false);
            $scope.timePickerObject.inputEpochTime = ($scope.time.getHours() * 60 * 60);
            $rootScope.$emit('newTime', $scope.time);
        }
    };

});
