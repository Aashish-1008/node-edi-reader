var loop_837_P = require('./837P');


module.exports = {
	getLoopData: function(messageType) {
		if(messageType == '837P'){
			return loop_837_P;
		}
	}
}