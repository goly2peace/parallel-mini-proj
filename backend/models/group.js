var mongoose = require('mongoose');
const Schema = mongoose.Schema;
const GroupSchema = new Schema({
	name: String,
});
module.exports = Group = mongoose.model('Group', GroupSchema);