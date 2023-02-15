var mongoose = require('mongoose');
var Schema = mongoose.Schema;

otherSchema = new Schema( {
	unique_id: Number,
	address: String,
	phone: String,
	postalcode: String,
	users: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User'
	},
}),
OtherInfo = mongoose.model('OtherInfo', otherSchema);

module.exports = OtherInfo;