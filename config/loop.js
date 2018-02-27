var loop_837_P = require('./005010X222A1'),
	loop_837_I = require('./005010X223A2'),
	loop_837_D_A1 = require('./005010X224A1'),
	loop_837_D_A2 = require('./005010X224A2');


module.exports = {
	getLoopData: function(messageType) {
		if (messageType == '005010X222A1') {
			return loop_837_P;
		} else if (messageType == "005010X223A2") {
			return loop_837_I;
		} else if (messageType == "005010X224A1") {
			return loop_837_D_A1;
		} else if (messageType == "005010X224A2") {
			return loop_837_D_A2;
		}
	}
}