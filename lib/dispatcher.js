/*jslint node: true, vars: true, indent: 4 */
(function (__dirname, module) {
    "use strict";

    var redis = require('socket.io-redis'),
        fs = require('fs'),
        path = require("path"),
        socket = require("socket.io"),
//        MongoStore = require('mong.socket.io'),
//        MongoStore = require('socket.io-mongo'),
        hbars = require("handlebars");

    function locate(dirs, file, cb, idx) {
        var i = idx || 0;

        if (i >= dirs.length) {
            return cb(new Error("file " + file + " not find in " + dirs));
        }

        var qfile = path.join(dirs[i], file);

        return fs.exists(qfile, function (exists) {
            if (exists) {
                return cb(undefined, qfile);
            }

            return locate(dirs, file, cb, i + 1);
        });
    }

    function listen(app, logger, hidden) {

        var server = app.httpServer;

        if (hidden.secure) {
            server = app.httpsServer;
        }

        var io = socket.listen(server, {
            "match origin protocol": true,
            logger: {
                info: logger.info,
                debug: function () {
                },
                notice: logger.notice,
                warn: logger.warn,
                error: logger.error
            },
            secure: hidden.secure
        });

        io.on('connection', function () {
            io.set('transports', ['websocket', 'htmlfile', 'xhr-polling', 'jsonp-polling', 'polling']);

            //io.eio.pingInterval = 60000;
            //io.eio.pingTimeout = 60000;

            io.set('log level', 1);
        });

        io.adapter(redis({
            host: hidden.redis.host,
            port: hidden.redis.port
        }));

        io.sockets.on('connection', function (client) {
            hidden.active = true;
            var topics = Object.keys(hidden.listeners);

            topics.forEach(function (topic) {
                var registered = hidden.listeners[topic];

                registered.forEach(function (listener) {
                    if (topic === 'connection') {
                        return listener.apply(client);
                    }

                    return client.on(topic, function () {
                        listener.apply(client, arguments);
                    });
                });
            });
        });

        app.io = io;
    }

    function getRequestHandler(hidden, defaults, cb) {
        return function (req, res, next) {
            if (!req.url.match(req.url.match(/js\/app-middle\.js$/))) {
                return next();
            }

            return locate(defaults["public"], "js/app-middle.js", function (err, manifestFile) {
                if (err) {
                    return cb(err);
                }

                return fs.readFile(manifestFile, "utf-8", function (err, content) {
                    if (err) {
                        throw err;
                    }
                    var template = hbars.compile(content);
                    var body = template({
                            secureClient: hidden.secureClient,
                            secure: hidden.secure,
                            port: hidden.secureClient ? hidden.sslPort : hidden.listenPort
                        }),
                        ctl = hidden.logger.isDebugging ? 'NO-CACHE' : 'public, max-age=' + (defaults.maxAge / 1000),
                        headers = {
                            'Content-Type': 'application/javascript; charset=UTF-8',
                            'Content-Length': body.length,
                            'Cache-Control': ctl
                        };

                    res.writeHead(200, headers);
                    return res.end(body);
                });
            });
        };
    }

    function registerListener(listeners, topic, listener) {
        var registered = listeners[topic] = listeners[topic] || [];

        registered.push(listener);
    }

    function registerModule(listeners, mod) {
        var topics = Object.keys(mod);

        topics.forEach(function (topic) {
            var listener = mod[topic];

            registerListener(listeners, topic, listener);
        });
    }

    module.exports = function (defaults, app, lopts, gopts, cb) {

        /*
         secureClient: if you are proxying and want only the socket.io client to be secure, you should set secureClient to be true and secure to be false.
         secure: secures the socket.io server (and client if secureClient isn't specified) to be SSL
         */

        var hidden = {
            redis: lopts.redis || gopts.redis,
            secureClient: lopts.secureClient || gopts.secureClient || lopts.secure || gopts.secure || !!app.httpsServer,
            secure: lopts.secure || gopts.secure || !!app.httpsServer,
            //listenPort: lopts.advertizedListenPort || gopts.advertizedListenPort || app.listenPort,
            listenPort: app.listenPort || lopts.advertizedListenPort || gopts.advertizedListenPort,
            sslPort: lopts.advertizedSslPort || gopts.advertizedSslPort || app.sslPort,
            logger: app.logger,
            listeners: {},
            active: false,
            mongo_storage: lopts.mongo_storage || gopts.mongo_storage,
            redis_storage: lopts.redis_storage || gopts.redis_storage,
            mongodb: lopts.mongoose || gopts.mongoose
        },
            requestHandler = getRequestHandler(hidden, defaults);

        listen(app, app.logger, hidden);

        app.use(requestHandler);

        return cb(undefined, {
            secure: hidden.secure,
            on: function () {
                if (hidden.active) {
                    throw new Error("clients already active");
                }

                if (arguments.length == 1) {
                    return registerModule(hidden.listeners, arguments[0]);
                }

                return registerListener(hidden.listeners, arguments[0], arguments[1]);
            }
        });
    };
})(__dirname, module);