const mongoose = require('mongoose');

const pageContentSchema = new mongoose.Schema({
  pageName: { // e.g., 'homepage', 'about', 'contact'
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  sections: [ // Flexible structure for different content sections
    {
      sectionName: { type: String, required: true }, // e.g., 'hero', 'about_text', 'contact_info'
      content: { type: String, required: true }, // HTML or Markdown content
      // You can add more fields like 'image_url' if sections have specific images
    }
  ],
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

const PageContent = mongoose.model('PageContent', pageContentSchema);

module.exports = PageContent;