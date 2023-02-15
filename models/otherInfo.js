var mongoose = require('mongoose');
var Schema = mongoose.Schema;

otherSchema = new Schema( {
	unique_id: Number,
	address: String,
	phone: String,
	postalcode: String,
}),
OtherInfo = mongoose.model('OtherInfo', otherSchema);

module.exports = OtherInfo;