angular.module('main.service', [
    'LocalStorageModule',
])

.factory('MainData', function(MainFactory, localStorageService) {

    var churches = [];
    var service = {};

    function gpstokm(lat1, lon1, lat2, lon2) {
        var R = 6371; //km
        var dLat = (lat2-lat1) * Math.PI / 180;
        var dLon = (lon2-lon1) * Math.PI / 180;
        var lat1 = lat1 * Math.PI / 180;
        var lat2 = lat2 * Math.PI / 180;
        var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                    Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
        var d = R * c;

        return d;
    }

    function compare(a,b) {
        if (a.distance < b.distance)
            return -1;
        if (a.distance > b.distance)
            return 1;
        return 0;
    }

    function isSunday(date) {
        return (date.getDay() == 0);
    };

    function isNotEarlier(h1, m1, h2, m2) {
        return ((h1 > h2) || ((h1 == h2) && (m1 >= m2)))
    };

    function todayMass(date, church) {
        result = null;

        if (isSunday(date)) {
            angular.forEach(church.sundays, function (day, idx) {
                if (result == null) {
                    var newTime = day.split(":");
                    var h = parseInt(newTime[0]);
                    var m = parseInt(newTime[1]);
                    if (isNotEarlier(h, m, date.getHours(), date.getMinutes())) {
                        result = {
                            id: idx,
                            time: displayTime(h, m)
                        };
                    }
                }
            });
        }
        else {
            angular.forEach(church.weekdays, function (day, idx) {
                if (result == null) {
                    var newTime = day.split(":");
                    var h = parseInt(newTime[0]);
                    var m = parseInt(newTime[1]);
                    if (isNotEarlier(h, m, date.getHours(), date.getMinutes())) {
                        result = {
                            id: idx,
                            time: displayTime(h, m)
                        };
                    }
                }
            });
        }
        return result;
    };

    function displayTime(h, m) {
        var h2;
        var m2;
        if (h < 10) {
            h2 = "0"+h;
        }
        else {
            h2 = h;
        }
        if (m < 10) {
            m2 = "0"+m;
        }
        else {
            m2 = m;
        }
        return h2+":"+m2;
    };

    service.churchesAsync = function (lat, lng, time) {
        churches = [];
        return MainFactory.churches()
        .success(function(d) {
            angular.forEach(d, function(church, idx) {
                var lat1 = lat;
                var lon1 = lng;
                var lat2 = parseFloat(church.location.lat);
                var lon2 = parseFloat(church.location.lon);
                if (lat2 != 0 && lon2 != 0) {
                    church.distance = gpstokm(lat, lon1, lat2, lon2);
                    if (church.distance > 1) {
                        var str = Math.round(church.distance*10)/10 + ' km';
                        church.displayDistance = str.replace(".", ",");
                    }
                    else {
                        church.displayDistance = Math.round(church.distance*1000) + ' m';
                    }
                    church.todayMass = todayMass(time, church);
                    churches.push(church);
                }
            });

            churches.sort(compare);
        })
        .error(function(d, f) {
            console.log(d);
            console.log(f);
        });
    };

    service.connectionAsync = function (start, end, roads) {
        var kmtorads = 0.015060;
    };

    service.getChurches = function () { return churches; };

    return service;

});
