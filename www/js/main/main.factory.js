angular.module('main.factory', [
])

.factory('MainFactory', function($http) {
    var radius = 100000;

    return {
        churches: function() {
            return $http.get('js/main/churches.json');
            // return $http.get('js/main/churchesWWA.json');
        }
    };

})
