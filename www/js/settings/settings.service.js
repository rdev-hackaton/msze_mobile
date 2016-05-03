angular.module('settings.service', [
    'LocalStorageModule',
])

.factory('SettingsData', function($q, localStorageService) {
    var service = {};

    service.isBoundary = function() {
        var defer = $q.defer();
        defer.resolve(localStorageService.get('isBoundary'));
        return defer.promise;
    };

    service.setBoundary = function(value) {
        return localStorageService.set('isBoundary', value);
    };

    service.isCurrentTime = function() {
        var defer = $q.defer();
        defer.resolve(localStorageService.get('isCurrentTime'));
        return defer.promise;
    };

    service.setCurrentTime = function(value) {
        return localStorageService.set('isCurrentTime', value);
    };

    service.getDistance = function() {
        var defer = $q.defer();
        service.isBoundary()
        .then(function(isBound) {
            if (!isBound) {
                defer.resolve(localStorageService.get('distance'));
            }
            else {
                defer.resolve(100000);
            }
        });
        return defer.promise;
    };

    service.setDistance = function(value) {
        return localStorageService.set('distance', value);
    };

    service.getTime = function() {
        var defer = $q.defer();
        service.isCurrentTime()
        .then(function(isCur) {
            if (isCur) {
                defer.resolve(new Date());
            }
            else {
                defer.resolve(new Date(localStorageService.get('time')));
            }
        });
        return defer.promise;
    };

    service.setTime = function(value) {
        return localStorageService.set('time', value);
    };

    service.getLat = function() {
        var defer = $q.defer();
        defer.resolve(localStorageService.get('lat'));
        return defer.promise;
    };

    service.setLat = function(value) {
        return localStorageService.set('lat', value);
    };

    service.getLng = function() {
        var defer = $q.defer();
        defer.resolve(localStorageService.get('lng'));
        return defer.promise;
    };

    service.setLng = function(value) {
        return localStorageService.set('lng', value);
    };

    return service;
});
