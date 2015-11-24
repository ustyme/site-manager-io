(function (undefined) {
    // Common JS // require JS
    var _, $, Backbone, exports;
    if (typeof window === 'undefined' || typeof require === 'function') {
        $ = require('jquery');
        _ = require('underscore');
        Backbone = require('backbone');
        exports = Backbone;
        if (module) module.exports = exports;
    } else {
        $ = this.$;
        _ = this._;
        Backbone = this.Backbone;
        exports = this;
    }

    Backbone.Model.prototype.idAttribute = "_id";

    //TODO: move to it's own js
    Backbone.Model.prototype.register = function(logic) {
        this.logic = logic;
    };

    Backbone.Model.prototype.publish = function(socket, method, model, cb) {
        if(this.logic) {
            socket.emit('publish', {
                method: method,
                logic: this.logic
            }, model, cb);
        }
    };
    Backbone.Collection.prototype.register = function(logic) {
        this.logic = logic;
    };

    Backbone.Collection.prototype.publish = function(socket, method, collection, cb) {
        if(this.logic) {
            socket.emit('publish', {
                method: method,
                logic: this.logic
            }, collection, cb);
        }
    };

})();