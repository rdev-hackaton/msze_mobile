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

    var myLat;
    var myLng;

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
        target = $scope.churches[id];
        idx = $scope.allChurches.indexOf(target);
        $scope.lat = target.location.lat;
        $scope.lng = target.location.lng;
        NgMap.getMap()
        .then(function (map) {
            map.setZoom(16);
            closeIWindows()
            .then(function () {
                allInfowindows[idx].open(map, allMarkers[idx]);
                infowindows.push({
                    iwindow: allInfowindows[idx],
                    marker: allMarkers[idx]
                });
            });
        });
        $ionicScrollDelegate.scrollTop();
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
        launchnavigator.navigate(target.address, null, function () {}, function (error) {});
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

    fromServices()
    .then(function() {
        return allJobs();
    })
    .then(function () {
        $interval(function() {
            console.log('interval task');
            return localizeMe(false)
            .then(function() {
                return SettingsData.getTime()
                .then(function(time) {
                    var defer = $q.defer();
                    console.log(time);
                    $scope.time = time;
                    defer.resolve();
                    return defer.promise;
                });
            })
            .then(function() {
                // return getData(myLat, myLng, $scope.time);
                return prepareMap();
            });
        }, 10000);
    });

    function allJobs() {
        console.log('allJobs');
        return localizeMe(true)
        .then(function() {
            $scope.lat = myLat;
            $scope.lng = myLng;
            return prepareMap();
        })
        .then(function () {
            var defer = $q.defer();
            $ionicLoading.hide();
            console.log('allJobs done');
            defer.resolve();
            return defer.promise;
        });
    };

    function fromServices() {
        return $q.all([
            SettingsData.getLat()
            .then(function(lat) {
                $scope.lat = myLat = lat;
            }),
            SettingsData.getLng()
            .then(function(lng) {
                $scope.lng = myLng = lng;
            }),
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

            defer.resolve(allMarkers);
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
            m.setMap(null);
        });
        allMarkers = [];

        defer.resolve();
        console.log('clearMarkers succeeded');
        return defer.promise;
    };

    function prepareMap() {
        console.log('prepareMap');
        return getData(myLat, myLng, $scope.time)
        .then(function() {
            return clearMarkers();
        })
        .then(function() {
            return generateMapMarkers();
        })
        .then(function () {
            console.log('prepareMap done');
        });
    };

    function getData(lat, lng, time) {
        var defer = $q.defer();
        console.log('getData');

        // console.log($scope.lat);
        // console.log($scope.lng);
        MainData.churchesAsync(lat, lng, time)
        .then(function () {
            $scope.allChurches = MainData.getChurches();
            // console.log($scope.allChurches);
            $scope.churches = [];
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
            defer.resolve($scope.churches);
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

    function localizeMe(infoMode) {
        var defer = $q.defer();

        console.log('localizeMe');
        navigator.geolocation.getCurrentPosition(function (position) {
            console.log('localizeMe succeeded');

            myLat = position.coords.latitude;
            myLng = position.coords.longitude;
            console.log(myLat);
            console.log(myLng);
            SettingsData.setLat(myLat);
            SettingsData.setLng(myLng);

            NgMap.getMap()
            .then(function (map) {
                if (myMarker) {
                    myMarker.setPosition(new google.maps.LatLng(myLat, myLng));
                }
                else {
                    myMarker = new google.maps.Marker({
                        title: "Twoja lokalizacja",
                        position: new google.maps.LatLng(myLat, myLng),
                        map: map,
                        zoom: 16,
                    });
                }
                defer.resolve([myLat, myLng]);
            });
        },
        function () {
            console.log('localizeMe failed');

            if (infoMode) {
                alertMe()
                .then(function () {
                    NgMap.getMap()
                    .then(function (map) {
                        if (myMarker) {
                            myMarker.setPosition(new google.maps.LatLng(myLat, myLng));
                        }
                        else {
                            myMarker = new google.maps.Marker({
                                title: "Twoja lokalizacja",
                                position: new google.maps.LatLng(myLat, myLng),
                                map: map,
                                zoom: 12,
                            });
                        }
                        defer.resolve([myLat, myLng]);
                    });
                });
            }
            else {
                defer.resolve([myLat, myLng]);
            }
        },
        {
            maximumAge: 0,
            timeout: 6000,
            enableHighAccuracy: false
        });
        return defer.promise;
    };

})
