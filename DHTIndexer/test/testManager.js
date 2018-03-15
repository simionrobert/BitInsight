var Manager = require('../lib/Manager');

manager = new Manager();
manager.on('dataReady', function (name, files, listIP) {
    console.log('\nTorrent found: ' + name);
    console.log('Files: ');

    for (let i = 0; i < files.length; i++) {
        console.log('\t' + files[i].name);
    }

    console.log('IP: ');

    for (let i = 0; i < listIP.length; i++) {
        console.log('\t' + listIP[i].host);
    }

});

manager.getInfo('726b4809351adf6fedc6ad779762829bf5512ae1');