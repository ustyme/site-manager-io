/*jshint white: false, node: true, vars: true, indent: 4 */
(function (module, __dirname) {
    "use strict";
    var path = require('path'),
        templates = path.join(__dirname, "../", "templates");

    module.exports = {
        /**
         * The directories to be searched for public artifacts.
         */
        "public":[
            path.join(__dirname, "..", "public")
        ],
        "scripts": [
            //"socket.io/socket.io.js",
            {"name": "socket.io/socket.io.js", "agents": ['Mac', 'Windows', 'Chrome']},
            "js/libs/underscore/underscore-1.4.4.js",
            {"name": "js/libs/jquery/jquery-2.1.1.min.js", "agents": ['Mac', 'Windows', 'Chrome']},
            //"js/libs/jquery/jquery-2.1.1.min.js",
            "js/libs/backbone/backbone-1.0.0.js",
            "js/app-async.js",
            "js/app-utils.js",
            "js/app-starter.js",
            "js/app-store.js",
            "js/app-middle.js",
            "js/app-backbone.js",
            "js/app-container.js"],
        "trailingScripts": [],
        "metas": [
            {
                "name": "HandheldFriendly",
                "content": "True"
            },
            {
                "name": "viewport",
                "content": "width=device-width,initial-scale=1.0,maximum-scale=1.0"
            },
            {
                "name": "apple-mobile-web-app-capable",
                "content": "yes"
            },
            {
                "name": "apple-mobile-web-app-status-bar-style",
                "content": "black"
            }
        ],
        "htmlFiles": [
            path.join(templates, "container.html")
        ],
        "links": [
            {
                "rel": "apple-touch-startup-image",
                "href": "startup.png"
            }
        ],
        "useRequireJS": false


    };
})(module, __dirname);
