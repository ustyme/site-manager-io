/*jslint node: true, vars: true, indent: 4 */
(function (module) {
    "use strict";

    module.exports = function(logger) {
        return {
            'middle-initialize':function (id, cb) {

                this.data = id;
//                this.set("data", id);
                logger.info("initialized", this.id, id);

//                logger[level]
                var loggingLevel = 'debug';
                if(process.env.NODE_ENV === "production") {
                    loggingLevel = 'error';
                }
                if(cb) {
                    cb(undefined, {loggingLevel: loggingLevel});
                }

            }
        };
    };
})(module);