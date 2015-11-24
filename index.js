/*jslint node: true, vars: true, indent: 4 */
(function (module) {
  "use strict";

  var path = require("path"),
    templates = path.join(__dirname, "templates"),
    pubdir = path.join(__dirname, "public"),
    clientInit = require("./lib/client-init"),
    clientLogger = require("./lib/client-logger"),
    dispatcher = require("./lib/dispatcher"),
    siteAssets = require('site-assets'),
    assets = require('./lib/assets');

  module.exports = function (defaults, app, lopts, gopts, cb) {
    dispatcher(defaults, app, lopts, gopts, function (err, dispatcher) {
      dispatcher.on(clientLogger(app.logger));
      dispatcher.on(clientInit(app.logger));

      siteAssets.merge(defaults, assets);

      defaults["public"].unshift(pubdir);

      return cb(undefined, defaults, dispatcher);
    });
  };
})(module);