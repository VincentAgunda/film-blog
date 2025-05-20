const express = require('express');
const router = express.Router();
const PageContent = require('../models/PageContent');
const { protect, authorize } = require('../middleware/authMiddleware');

// @route   GET /api/content/:pageName
// @desc    Get content for a specific page
// @access  Public
router.get('/:pageName', async (req, res) => {
  try {
    const content = await PageContent.findOne({ pageName: req.params.pageName });
    if (!content) {
      return res.status(404).json({ message: 'Page content not found' });
    }
    res.json(content);
  } catch (error) {
    console.error('Fetch page content error:', error.message);
    res.status(500).send('Server error fetching page content');
  }
});

// @route   POST /api/content
// @desc    Create new page content (Admin only)
// @access  Private (Admin only)
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { pageName, sections } = req.body;
    let pageContent = await PageContent.findOne({ pageName });

    if (pageContent) {
      return res.status(400).json({ message: 'Page content for this page name already exists. Use PUT to update.' });
    }

    pageContent = new PageContent({
      pageName,
      sections,
      updatedBy: req.user.id,
    });

    await pageContent.save();
    res.status(201).json({ message: 'Page content created successfully', pageContent });
  } catch (error) {
    console.error('Create page content error:', error.message);
    res.status(500).send('Server error creating page content');
  }
});

// @route   PUT /api/content/:pageName
// @desc    Update content for a specific page (Admin only)
// @access  Private (Admin only)
router.put('/:pageName', protect, authorize('admin'), async (req, res) => {
  try {
    const { sections } = req.body;
    const pageContent = await PageContent.findOneAndUpdate(
      { pageName: req.params.pageName },
      { $set: { sections, updatedBy: req.user.id } },
      { new: true, runValidators: true }
    );

    if (!pageContent) {
      return res.status(404).json({ message: 'Page content not found to update.' });
    }
    res.json({ message: 'Page content updated successfully', pageContent });
  } catch (error) {
    console.error('Update page content error:', error.message);
    res.status(500).send('Server error updating page content');
  }
});

module.exports = router;