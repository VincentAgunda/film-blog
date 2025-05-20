const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const Image = require('../models/Image');
const PageContent = require('../models/PageContent');

// --- Public Image Routes ---

// @desc    Get all images
// @route   GET /api/images
// @access  Public
router.get('/images', asyncHandler(async (req, res) => {
    const images = await Image.find({});
    res.json(images);
}));

// @desc    Get image by ID
// @route   GET /api/images/:id
// @access  Public
router.get('/images/:id', asyncHandler(async (req, res) => {
    const image = await Image.findById(req.params.id);
    if (image) {
        res.json(image);
    } else {
        res.status(404);
        throw new Error('Image not found');
    }
}));

// --- Public Page Content Routes ---

// @desc    Get all page content entries
// @route   GET /api/content
// @access  Public
router.get('/content', asyncHandler(async (req, res) => {
    const pageContents = await PageContent.find({});
    res.json(pageContents);
}));

// @desc    Get page content by page name (e.g., 'home', 'about')
// @route   GET /api/content/:pageName
// @access  Public
router.get('/content/:pageName', asyncHandler(async (req, res) => {
    const pageContent = await PageContent.findOne({ pageName: req.params.pageName });
    if (pageContent) {
        res.json(pageContent);
    } else {
        res.status(404);
        throw new Error('Page content not found');
    }
}));

module.exports = router;