var loop_837_P = require('./005010X222A1'),
	loop_837_I = require('./005010X223A2');

module.exports = {
	getLoopData: function(messageType) {
		if (messageType == '005010X222A1') {
			return loop_837_P;
		} else if (messageType == "005010X223A2") {
			return loop_837_I;
		}
	}
}