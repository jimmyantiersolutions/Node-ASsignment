var mongoose = require('mongoose');
var Schema = mongoose.Schema;

imageSchema = new Schema( {
	
	user_id: String,
	file_name: String,
	original_name: String,
	folder_name: String,
}),
UserImage = mongoose.model('UserImage', imageSchema);

module.exports = UserImage;