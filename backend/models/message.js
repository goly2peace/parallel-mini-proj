var mongoose = require('mongoose');
const Schema = mongoose.Schema;
const MessageSchema = new Schema({
	uid: Schema.ObjectId,
	gid: Schema.ObjectId,
	content: String,
	send_at: Date,
});
module.exports = Message = mongoose.model('Message', MessageSchema);