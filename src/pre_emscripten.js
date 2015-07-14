var path = require('path');


var Module = {
    print: function(text) {
        console.log(text);
    },
    printErr: function(text) {
        console.error(text);
    },
    memoryInitializerPrefixURL: __dirname + '//',
};
