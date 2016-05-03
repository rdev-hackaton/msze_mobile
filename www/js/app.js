// Ionic Msze App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'msze' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'msze.controllers' is found in controllers.js
angular.module('msze', [
    'ionic',
    'ngMap',
    'ngRoute',
    'LocalStorageModule',

    'msze.controllers',
    'msze.main',
    'msze.settings',
    'msze.help'
])

.run(function($ionicPlatform, localStorageService) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      // cordova.plugins.Keyboard.disableScroll(true);
    }
    if (window.StatusBar) {
      StatusBar.styleDefault();
    }

    if (localStorageService.get('lat') == null) {
      localStorageService.set('lat', '52.1614276');
    }
    if (localStorageService.get('lng') == null) {
      localStorageService.set('lng', '21.0278742');
    }
    if (localStorageService.get('isBoundary') == null) {
      localStorageService.set('isBoundary', true);
    }
    if (localStorageService.get('distance') == null) {
      localStorageService.set('distance', 5);
    }
    localStorageService.set('isCurrentTime', true);
    localStorageService.set('time', null);

  });
})

.config(function($stateProvider, $urlRouterProvider) {
  $stateProvider

    .state('app', {
    url: '/app',
    abstract: true,
    templateUrl: 'js/menu.html',
    controller: 'AppCtrl'
  })

  .state('app.main', {
    url: '/main',
    views: {
      'menuContent': {
        templateUrl: 'js/main/main.html',
        controller: 'MainCtrl'
      }
    }
  })

  .state('app.settings', {
    url: '/settings',
    views: {
      'menuContent': {
        templateUrl: 'js/settings/settings.html',
        controller: 'SettingsCtrl'
      }
    }
  })

  .state('app.help', {
    url: '/help',
    views: {
      'menuContent': {
        templateUrl: 'js/help/help.html',
        controller: 'HelpCtrl'
      }
    }
  })

  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/app/main');
});
