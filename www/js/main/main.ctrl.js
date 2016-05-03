angular.module('msze.main', [
    'main.service',
    'settings.service',
    'main.factory',
])

.controller('MainCtrl', function ($scope, $rootScope, $ionicLoading, $ionicPopup, $ionicScrollDelegate, $interval, $compile, $q, MainData, SettingsData, NgMap) {
    var churchIcon = "img/logo3.png";
    var church2Icon = "img/logo4.png";

    var allMarkers = [];
    var hoverMarkers = [];
    var directions = [];
    var infowindows = [];
    var allInfowindows = [];

    var myMarker;

    $scope.allChurches = [];
    $scope.churches = [];
    $scope.todayChurches = [];
    $scope.otherChurches = [];
    $scope.displayChurches = {
        show: false,
    };

    $scope.loading = $ionicLoading.show();

    $scope.showAlert = function() {
        var alertPopup = $ionicPopup.alert({
            title: 'Błąd GPS!',
            template: 'Nie udało się zlokalizować użytkownika',
        });

        alertPopup.then(function(res) {
            console.log('GPS error launched');
        });
    };

    // centering clicked church
    $scope.center = function (id) {
        var target;
        var idxx;
        angular.forEach($scope.churches, function (church, idx) {
            if (church.id.indexOf(id) > -1) {
                target = church;
                idxx = idx;
            }
        });
        $scope.lat = target.location.lat;
        $scope.lng = target.location.lng;
        NgMap.getMap()
        .then(function (map) {
            map.setZoom(16);
            closeIWindows()
            .then(function () {
                allInfowindows[idxx].open(map, allMarkers[idxx]);
                infowindows.push({
                    iwindow: allInfowindows[idxx],
                    marker: allMarkers[idxx]
                });
            });
        });
        $ionicScrollDelegate.scrollTop();
    };

    allJobs()
    .then(function () {
        $interval(function() {
            console.log('interval task');
            return $q.all([
                silentLocalize()
                .then(getData),
                SettingsData.getTime()
                .then(function(time) {
                    console.log(time);
                    $scope.time = time;
                }),
            ]);
        }, 10000);
    });

    function fromServices() {
        return $q.all([
            NgMap.getMap()
            .then(function (map) {
                myMarker = new google.maps.Marker({
                    title: "Twoja lokalizacja",
                    position: new google.maps.LatLng($scope.lat, $scope.lng),
                    map: map,
                    zoom: 9,
                });
            }),
            SettingsData.getDistance()
            .then(function(boundary) {
                // console.log(boundary);
                $scope.boundary = boundary;
            }),
            SettingsData.getTime()
            .then(function(time) {
                // console.log(time);
                $scope.time = time;
            })
        ]);
    };

    function allJobs() {
        var defer = $q.defer();

        console.log('allJobs');
        fromServices()
        .then(localizeMe)
        .then(prepareMap)
        .then(function () {
            console.log('allJobs done');
            // console.log($scope.churches);
            // console.log($scope.time);
            // console.log($scope.lat);
            defer.resolve();
        });

        return defer.promise;
    };

    $rootScope.$on('newDistance', function (event, val) {
        console.log('newDistance');
        $scope.boundary = val;
        console.log($scope.boundary);
        prepareMap();
    });

    $rootScope.$on('newTime', function (event, val) {
        console.log('onNewTime');
        if (val == 0) $scope.time = new Date();
        else $scope.time = new Date(val);
        console.log($scope.time);
        prepareMap();
    });

    function generateMapMarkers() {
        var defer = $q.defer();

        console.log('generateMapMarkers');
        NgMap.getMap()
        .then(function (map) {
            // console.log($scope.allChurches);
            angular.forEach($scope.allChurches, function (church, idx) {
                var lat = church.location.lat;
                var lng = church.location.lon;
                var latlng = new google.maps.LatLng(lat, lng);
                var distance = church.displayDistance;
                var id = church.id;
                var name = church.name;
                var weekdays = church.weekdays;
                var sundays = church.sundays;
                var aIdx = 0;
                var holyDaysStr = 'Niedziele i święta: ';
                var weekdaysStr = 'Dni powszednie: ';
                if (isHolyDay($scope.time)) {
                    if (church.todayMass) aIdx = church.todayMass.id;
                    else aIdx = sundays.length;
                    sundays = displayHrs(church.sundays, aIdx);
                    weekdays = displayHrs(church.weekdays, null);
                    holyDaysStr = '<strong>'+holyDaysStr+'</strong>';
                }
                else {
                    if (church.todayMass) aIdx = church.todayMass.id;
                    else aIdx = weekdays.length;
                    sundays = displayHrs(church.sundays, null);
                    weekdays = displayHrs(church.weekdays, aIdx);
                    weekdaysStr = '<strong>'+weekdaysStr+'</strong>';
                }
                var contentString = '<div id="content">' +
'<div id="siteNotice"></div>' +
// '<div style="text-align:justify;"><span style="float:right;"><b>'+name+'</b></span></div>'+
'<p style="text-align:right;"><b>'+name+'</b></p>'+
'<p style="margin-bottom:3px;"><strong>Odległość:</strong></p><p>'  + distance + '</p>' +
'<p style="margin-bottom:3px;">' + holyDaysStr + '</p><p>' + sundays + '</p>' +
'<p style="margin-bottom:3px;">' + weekdaysStr + '</p><p>' + weekdays + '</p>' +
'<p><a href="javascript:void(0)" data-ng-click="navigate(' + id + ')" style="float:right;">Nawiguj</a></p>' +
'</div>';
                var compiled = $compile(contentString)($scope);
                var infowindow = new google.maps.InfoWindow({
                    content: compiled[0]
                });
                allInfowindows.push(infowindow);
                var icon;
                if (church.todayMass) icon = churchIcon;
                else icon = church2Icon;

                var marker = new google.maps.Marker({
                    title: name,
                    position: latlng,
                    icon: icon,
                    map: map,
                });
                marker.addListener('click', function () {
                    closeIWindows()
                    .then(function () {
                        infowindow.open(map, marker);
                        infowindows.push({
                            iwindow: infowindow,
                            marker: marker
                        });
                    });
                });
                allMarkers.push(marker);
            });
            $scope.markerClusterer = new MarkerClusterer(map, allMarkers, {});
            // console.log(allMarkers);
            console.log('generateMapMarkers finished');

            defer.resolve();
        });

        return defer.promise;
    };

    function displayHrs(arr, idxx) {
        var result = "";
        if (idxx) result = '<span style="text-decoration:line-through;">';
        // var result = '<span style="text-decoration:line-through;">';
        angular.forEach(arr, function(val, idx) {
            if (idx == idxx) result += "</span>";
            if (idx != 0) result += ", ";
            // if ((idx+1)%5==0) result += "<br />";
            result += val;
        });
        return result;
    };

    $scope.navigate = function (id) {
        var target;
        angular.forEach($scope.allChurches, function (church, idx) {
            // console.log(church);
            if (church.id.indexOf(id) > -1) {
                target = church;
            }
        });
        console.log("TARGET");
        // console.log(target);
        launchnavigator.navigate(
            target.address,
            null,
            function () {
            },
            function (error) {
            });
    };

    function closeIWindows() {
        var defer = $q.defer();

        angular.forEach(infowindows, function (iw, idx) {
            iw.iwindow.close();
        });
        infowindows = [];
        defer.resolve();

        return defer.promise;
    };

    $scope.toggleGroup = function (group) {
        group.show = !group.show;
    };
    $scope.isGroupShown = function (group) {
        return group.show;
    };

    $scope.showTime = function () {
        var hours = $scope.time.getHours();
        var minutes = $scope.time.getMinutes();
        if (hours < 10) { hours = "0"+hours; }
        if (minutes < 10) { minutes = "0"+minutes; }

        return hours+":"+minutes;
    };

    $scope.weekday = function () {
        var day = new Date();
        var days = ["Niedziela", "Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek", "Sobota"];
        return days[day.getDay()];
    };

    function isHolyDay(date) {
        return (date.getDay() == 0);
    };

    function clearMarkers() {
        var defer = $q.defer();

        console.log('clearMarkers');
        angular.forEach(allMarkers, function (m, idx) {
            // console.log(m);
            m.setMap(null);
        });
        allMarkers = [];
        $scope.churches = [];

        defer.resolve();
        console.log('clearMarkers succeeded');
        return defer.promise;
    };

    function prepareMap() {
        var defer = $q.defer();
        console.log('prepareMap');

        clearMarkers()
        .then(getData)
        .then(generateMapMarkers)
        // .then(function () {
            // generateMapMarkers();
        // })
        .then(defer.resolve)
        .then(function () {
            console.log('prepareMap done');
        });

        return defer.promise;
    };

    function getData() {
        var defer = $q.defer();
        console.log('getData');

        // console.log($scope.lat);
        // console.log($scope.lng);
        MainData.churchesAsync($scope.lat, $scope.lng, $scope.time)
        .then(function () {
            $scope.allChurches = MainData.getChurches();
            // console.log($scope.allChurches);
            angular.forEach($scope.allChurches, function (church, idx) {
                // console.log(church.distance);
                if (church.distance <= $scope.boundary && church.todayMass) {
                    $scope.churches.push(church);
                }
                // else {
                    // console.log(church.distance);
                    // console.log(church.todayMass);
                // }
            });
            // console.log($scope.churches);
            console.log('getData finished');
            defer.resolve();
        },
        function (d) {
            console.log('Error'+JSON.stringify(d));
            defer.reject();
        });

        return defer.promise;
    };

    function alertMe() {
        $scope.showAlert();
        return $q.all([
            SettingsData.getLat()
            .then(function(lat) {
                $scope.lat = lat;
            }),
            SettingsData.getLat()
            .then(function(lng) {
                $scope.lng = lng;
            }),
        ]);
    };

    function silentLocalize() {
        var defer = $q.defer();

        console.log('silentLocalize');

        navigator.geolocation.getCurrentPosition(function (position) {
            NgMap.getMap()
            .then(function (map) {
                if (myMarker) {
                    myMarker.setPosition(new google.maps.LatLng(position.coords.latitude, position.coords.longitude));
                }
                else {
                    myMarker = new google.maps.Marker({
                        title: "Twoja lokalizacja",
                        position: new google.maps.LatLng(position.coords.latitude, position.coords.longitude),
                        map: map,
                        zoom: 16,
                    });
                }
                console.log('silentLocalize succeeded');
                defer.resolve();
            });
        },
        function () {
            console.log('silentLocalize failed');
            defer.resolve();
        },
        {
            maximumAge: 0,
            timeout: 6000,
            enableHighAccuracy: false
        });
        return defer.promise;
    };

    function localizeMe() {
        var defer = $q.defer();

        console.log('localizeMe');

        navigator.geolocation.getCurrentPosition(function (position) {
            $ionicLoading.hide();
            $scope.lat = position.coords.latitude;
            $scope.lng = position.coords.longitude;
            console.log($scope.lat);
            console.log($scope.lng);
            SettingsData.setLat(position.coords.latitude);
            SettingsData.setLng(position.coords.longitude);

            NgMap.getMap()
            .then(function (map) {
                if (myMarker) {
                    myMarker.setPosition(new google.maps.LatLng(position.coords.latitude, position.coords.longitude));
                }
                else {
                    myMarker = new google.maps.Marker({
                        title: "Twoja lokalizacja",
                        position: new google.maps.LatLng(position.coords.latitude, position.coords.longitude),
                        map: map,
                        zoom: 16,
                    });
                }
                console.log('localizeMe succeeded');
                defer.resolve();
            });
        },
        function () {
            $ionicLoading.hide();
            alertMe()
            .then(NgMap.getMap())
            .then(function (map) {
                if (myMarker) {
                    console.log('scope lat');
                    console.log($scope.lat);
                    myMarker.setPosition(new google.maps.LatLng($scope.lat, $scope.lng));
                }
                else {
                    myMarker = new google.maps.Marker({
                        title: "Twoja lokalizacja",
                        position: new google.maps.LatLng($scope.lat, $scope.lng),
                        map: map,
                        zoom: 9,
                    });
                }
                console.log('localizeMe failed');
                defer.resolve();
            });
        },
        {
            maximumAge: 0,
            timeout: 6000,
            enableHighAccuracy: false
        });
        return defer.promise;
    };

})
