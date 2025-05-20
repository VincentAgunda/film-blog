const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const { protect, authorize } = require('../middleware/authMiddleware');
const { upload, uploadToFirebase } = require('../middleware/uploadMiddleware');
const Image = require('../models/Image');
const PageContent = require('../models/PageContent');
const admin = require('firebase-admin');

// @desc    Upload new image
// @route   POST /api/admin/images
// @access  Private/Admin
router.post('/images', 
    protect,
    authorize('admin'),
    upload.single('image'),
    uploadToFirebase,
    asyncHandler(async (req, res) => {
        if (!req.file || !req.file.firebaseUrl) {
            res.status(400);
            throw new Error('No image file provided or upload failed');
        }

        const { description, page } = req.body;

        const image = await Image.create({
            filename: req.file.filename,
            url: req.file.firebaseUrl,
            description: description || '',
            page: page || 'general',
            uploadedBy: req.user.id
        });

        res.status(201).json({
            message: 'Image uploaded successfully',
            image: {
                _id: image._id,
                url: image.url,
                filename: image.filename,
                description: image.description,
                page: image.page,
                createdAt: image.createdAt
            }
        });
    })
);

// @desc    Get all images
// @route   GET /api/admin/images
// @access  Private/Admin
router.get('/images', 
    protect,
    authorize('admin'),
    asyncHandler(async (req, res) => {
        const images = await Image.find().sort('-createdAt');
        res.json(images);
    })
);

// @desc    Delete an image
// @route   DELETE /api/admin/images/:id
// @access  Private/Admin
router.delete('/images/:id', 
    protect,
    authorize('admin'),
    asyncHandler(async (req, res) => {
        const image = await Image.findById(req.params.id);

        if (!image) {
            res.status(404);
            throw new Error('Image not found');
        }

        // Delete from Firebase Storage
        try {
            const bucket = admin.storage().bucket();
            await bucket.file(image.filename).delete();
        } catch (error) {
            console.error('Failed to delete from Firebase:', error);
            // Continue with DB deletion even if storage deletion fails
        }

        // Delete from database
        await Image.deleteOne({ _id: image._id });

        res.json({ message: 'Image deleted successfully' });
    })
);

// @desc    Create or update page content
// @route   POST /api/admin/content
// @access  Private/Admin
router.post('/content', 
    protect,
    authorize('admin'),
    asyncHandler(async (req, res) => {
        const { pageName, title, content } = req.body;

        if (!pageName || !content) {
            res.status(400);
            throw new Error('Page name and content are required');
        }

        let pageContent = await PageContent.findOne({ pageName });

        if (pageContent) {
            // Update existing
            pageContent.title = title || pageContent.title;
            pageContent.content = content;
            pageContent.lastUpdatedBy = req.user.id;
            await pageContent.save();
        } else {
            // Create new
            pageContent = await PageContent.create({
                pageName,
                title: title || '',
                content,
                lastUpdatedBy: req.user.id
            });
        }

        res.json({
            message: 'Content saved successfully',
            content: {
                pageName: pageContent.pageName,
                title: pageContent.title,
                content: pageContent.content,
                updatedAt: pageContent.updatedAt
            }
        });
    })
);

// @desc    Verify admin status
// @route   GET /api/admin/verify
// @access  Private
router.get('/verify', 
    protect,
    (req, res) => {
        res.json({ isAdmin: req.user.isAdmin });
    }
);

module.exports = router;