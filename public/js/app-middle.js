(function (window, io, $, _, Backbone, location, app) {
    "use strict";

    var ID = "id",
        SECURE = "{{secureClient}}" == "true",
        PORT = "{{port}}",
        watchedEvents = {};

    app.middle = app.middle || {};

    function getServerURL() {
        var protocol = SECURE ? "https://" : "http://",
            port = PORT || location.port;
        if(port == "80" || port == "3000") {
            port = "";
        } else if (port) {
            port = ":" + port;
        }

        return window.location.protocol + location.hostname;
    }

    function convert(arg) {
        try {
            return JSON.stringify(arg);
        }
        catch (e) {
            var simpified = {};

            _.each(arg, function (entry, key) {
                if (entry !== window) {
                    simpified[key] = entry;
                }
            });

            return convert(simpified);
        }
    }

    function log(socket, level, loggingLevel, _args) {

        var logToServer = false;
        if('error' === loggingLevel === level) {
            logToServer = true;
            console.error.apply(console, _args);
        } else if ('debug' === loggingLevel) {
            logToServer = true;
            console.log.apply(console, _args);
        }

        if(logToServer) {
            var args = Array.prototype.slice.call(_args),
                params = [
                    "log",
                    level,
                    new Date()
                ];

            _.each(args, function (arg) {
                var param = convert(arg);
                params.push(param);
            });

            return socket.emit.apply(socket, params);
        }
    }

    function emitter(socket) {
        return function () {
            return socket.emit.apply(socket, arguments);
        };
    }

    function connect(url, cb) {
        try {
            return cb(io.connect(
                url, {
                "reconnection limit":4001, // four second max delay
                "max reconnection attempts":Infinity,
                "match origin protocol": true,
                "force new connection":true,
                "secure": true
            }));
        }
        catch (e) {
            setTimeout(function () {
                connect(url, cb);
            }, 500);

            return app.error("io.connect exception", e);
        }
    }

    function openSocket(cb) {
        var tryAgain = function () {
                if (cb) {
                    app.log("middle trying to connect again");
                    setTimeout(function () {
                        openSocket(cb);
                    }, 500);
                }
            },
            app_log = app.log,
            app_debug = app.debug,
            app_error = app.error,
            url = getServerURL();
        console.log('************** url: ', url);

        return connect(url, function (socket) {
            socket.on('error', function (err) {
                app.error("middle socket error", err);
                tryAgain();
            });
            socket.on('connecting', function () {
                return app.log("middle connecting");
            });
            socket.on('connect_failed', function (err) {
                app.error("connect_failed", err);
                tryAgain();
            });
            socket.on('reconnect', function () {
                return app.log("middle reconnect");
            });
            socket.on('reconnecting', function () {
                return app.log("middle reconnecting");
            });
            socket.on('connect', function () {
                app.middle.connected = true;

                var _cb = cb,
                    device = window.device || {},
                    userAgent = navigator.userAgent || {};

                cb = undefined;

                socket.emit("middle-initialize", {
                    id:app.middle.id,
                    uuid:device.uuid,
                    name:device.name,
                    platform:device.platform,
                    version:device.version,
                    cordova:device.cordova,
                    userAgent: userAgent
                }, function(err, result) {

                    app.log = function () {
                        return log(socket, "info", result.loggingLevel, arguments);
                    };
                    app.debug = function () {
                        return log(socket, "debug", result.loggingLevel, arguments);
                    };
                    app.error = function () {
                        return log(socket, "error", result.loggingLevel, arguments);
                    };

                    app.log("middle connected");

                    return _cb && _cb(socket);
                });


            });
            socket.on('disconnect', function () {
                app.middle.connected = false;

                app.log = app_log;
                app.debug = app_debug;
                app.error = app_error;
                app.middle.trigger("disconnect", app.middle.id);

                return app.log("disconnected", app.middle.id);
            });
        });
    }



    app.starter.$(function (next) {
        if (app.middle.disable) {
            return next();
        }

        app.store("middle", function (store) {
            store.get(ID, function (id) {
                app.middle.id = (id && id.id) || app.utils.uuid();

                if (!id) {
                    store.save(ID, app.middle.id);
                }

                var bindSocketListeners = function(socket) {
                    app.middle.bind = app.middle.on = app.middle.on || function (event, callback, context) {
                        var events = event.split(/\s+/);

                        _.each(events, function (event) {
                            if (!watchedEvents[event]) {
                                watchedEvents[event] = true;
                                socket.on(event, function () {
                                    var args = Array.prototype.slice.call(arguments);

                                    args.unshift(event);

                                    return app.middle.trigger.apply(app.middle, args);
                                });
                            }
                        });

                        Backbone.Events.on.call(app.middle, event, callback, context);
                    };
                    app.middle.unbind = app.middle.off = app.middle.off || function () {
                        Backbone.Events.off.apply(app.middle, arguments);
                    };
                    app.middle.trigger = app.middle.trigger = app.middle.trigger || function () {
                        Backbone.Events.trigger.apply(app.middle, arguments);
                    };

                    app.middle.stop = function() {
                        console.log("disconnect");
                        socket.disconnect();
                    };

                    app.middle.restart = function() {
                        console.log("restart");
                        if(socket) {
                            socket.connect();
                        } else {
                            openSocket(function (socket) {
                                bindSocketListeners(socket);
                            });
                        }
                    };

                    app.middle.emit = emitter(socket);
                };

                return openSocket(function (socket) {
                    bindSocketListeners(socket);
                    return next();
                });
            });
        });
    });
})(window, window.io, $, _, Backbone, window.location, window["web-app"]);
