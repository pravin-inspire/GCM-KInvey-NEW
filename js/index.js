'use strict';

var app = {
    // Application Constructor
    initialize: function() {
        app.bindEvents();
    },

    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', app.onDeviceReady, false);
    },

    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        app.receivedEvent('deviceready');
    },

    // Update DOM on a Received Event
    receivedEvent: function(id) {
        app.log('Received Event: ' + id);
        app.log('Initialize Kinvey PhoneGap library.');

        var promise = Kinvey.init({
            appKey: window.APP_KEY,
            appSecret: window.APP_SECRET,
            apiHostName: window.API_HOSTNAME
        }).then(function(activeUser) {
            app.log('Kinvey PhoneGap library initialized.')

            if (!activeUser) {
                return Kinvey.User.signup({
                    username: 'phonegap',
                    password: 'phonegap'
                }).catch(function(err) {
                    if (err.name === 'UserAlreadyExists') {
                        return Kinvey.User.login('phonegap', 'phonegap');
                    }

                    throw err;
                });
            }

            return activeUser;
        }).then(function(activeUser){
            app.log('The phonegap user has been logged in to Kinvey.');
            app.log('Register the device for push notifications.');

            if (device.platform.toLowerCase() === 'android') {
                window.plugins.pushNotification.register(function() { }, function() { }, {
                    ecb      : 'onNotificationGCM',
                    senderID : window.GOOGLE_PROJECT_ID
                });
            }
            else {// iOS.
                window.plugins.pushNotification.register(app.registrationHandler, function(err) {
                    app.log('Unable to register the device.');
                    app.log('Error: ' + JSON.stringify(err));
                }, {
                    alert : 'true',
                    badge : 'true',
                    sound : 'true',
                    ecb   : 'onNotificationAPN'
                });
            }
        }).catch(function(err) {
            app.log('Error: ' + JSON.stringify(err));
        });
    },

    registrationHandler: function(deviceId) {
        if (!Kinvey.getActiveUser()) {
            app.log('No logged in user.');
        }
        else {
            Kinvey.Push.register(deviceId).then(function() {
                app.log('Device has been registered.');
            }, function(error) {
                app.log('Error: ' + JSON.stringify(err));
            })
        }
    },

    log: function(text) {
        var node = document.createElement('p');
        var textnode = document.createTextNode(text);
        node.appendChild(textnode);
        document.getElementById('output').appendChild(node);
    }
};

// Method to handle device registration for Android.
var onNotificationGCM = function(e) {
    if (e.event === 'registered') {
        app.registrationHandler(e.regid);
    } else if (e.event === 'message') {
        app.log('Received push notification.');
        navigator.notification.alert(e.payload.message);
    } else {
        app.log('Unable to register the device.');
    }
}

// Method to handle notifications on iOS.
var onNotificationAPN = function(e) {
    app.log('Received push notification.');

    if (e.alert) {
        navigator.notification.alert(e.alert);
    }

    if (e.sound) {
        var snd = new Media(e.sound);
        snd.play();
    }

    if (e.badge) {
        window.plugins.pushNotification.setApplicationIconBadgeNumber(function() {
            // Success.
        }, function() {
            // Failure.
        }, event.badge);
    }
}
