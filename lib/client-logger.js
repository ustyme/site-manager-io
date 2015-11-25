/*jslint node: true, vars: true, indent: 4 */
(function (module) {
    "use strict";

    function convert(id, session, _args) {
        var args = Array.prototype.slice.call(_args, 2),
            params = [
                _args[0],
                _args[1],
                id,
                session
            ];

        args.forEach(function (arg) {
            var param = JSON.parse(arg);

            params.push(param);
        });

        return params;
    }

    module.exports = function (logger) {
        return {
            'log':function () {
                var client = this,
                    args = arguments;

                //TODO: does this work?
                return client.on("id", function (err, id) {
                    console.log('err: ' + err);
                    console.log('id: ' + id);
                    var params = convert(client.id, id, args),
                        level = params.shift(),
                        _logger = logger[level] || logger.info;
                    return _logger.apply(_logger, params);
                });
            }
        }
    };
})(module);