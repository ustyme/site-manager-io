/*global PhoneGap:false, require:false */
(function (_, app) {
    "use strict";
    app.async = app.async || {};

    app.async.parallel = app.async.parallel ||  function (call, cb) {
        var total = call.length;
        _.forEach(call, function(fn){
            fn(function(err, result){
                if(err) {
                    cb(err);
                }
                total--;
                if(total==0){
                    cb();
                }
            })
        });
    };

//    app.async.waterfall = function (calls, cb) {
//        var total = calls.length;
//        calls.forEach(function(callFn) {
//            app.async.parallel(callFn, function(err, result) {
//                if(err) {
//                    cb(err);
//                }
//                total--;
//                if(total==0){
//                    cb();
//                }
//            })
//        });
//    }

})(_, window["web-app"]);
