var mongoose = require('mongoose');
const Schema = mongoose.Schema;
const JoinSchema = new Schema({
	uid: Schema.ObjectId,
	username: String,
	gid: Schema.ObjectId,
	read_at: Date,
});
module.exports = Join = mongoose.model('Join', JoinSchema);