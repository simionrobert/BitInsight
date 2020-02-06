utils=require('../lib/utils')


for (var i = 0; i < 100; i++) {
    utils.generateRandomID(i, function (i, buf) {
        console.log(i)
    }.bind(this))
}
