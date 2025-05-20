const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
filename: {
type: String,
required: true,
},
url: {
type: String,
required: true,
},
description: {
type: String,
default: '',
},
// You might want to link images to specific pages
page: {
type: String, // e.g., 'homepage', 'about', 'services'
required: true,
},
uploadedBy: {
type: mongoose.Schema.Types.ObjectId,
ref: 'User',
},
}, {
timestamps: true,
});

const Image = mongoose.model('Image', imageSchema);

module.exports = Image;