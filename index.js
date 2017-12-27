
module.exports = require('./studioClient.js');

if(module.hot) {
    module.hot.accept('./studioClient.js', function() {
        var plugin = require('./studioClient.js');
        core.reloadPlugin(plugin);
    });
}