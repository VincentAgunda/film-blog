import { auth, db } from './auth.js';

export class CommentLikeSystem {
    constructor() {
        this.ventures = document.querySelectorAll('.service-block');
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadInitialData();
    }

    setupEventListeners() {
        this.ventures.forEach(venture => {
            const likeBtn = venture.querySelector('.like-button');
            const toggleCommentsBtn = venture.querySelector('.toggle-comments');
            
            // Like button click handler
            likeBtn?.addEventListener('click', async () => {
                await this.handleLike(likeBtn);
            });

            // Toggle comment section
            toggleCommentsBtn?.addEventListener('click', () => {
                const commentSection = venture.querySelector('.comment-section');
                commentSection.classList.toggle('active');
                
                // Update button text
                toggleCommentsBtn.textContent = 
                    commentSection.classList.contains('active') 
                    ? 'Hide Comments' 
                    : 'Show Comments';
            });
            
            // Comment form submission
            const commentForm = venture.querySelector('.comment-form');
            commentForm?.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.submitComment(commentForm, venture.dataset.id);
            });
        });
    }

    async loadInitialData() {
        const user = auth.currentUser;
        
        this.ventures.forEach(venture => {
            const ventureId = venture.dataset.id;
            const likeBtn = venture.querySelector('.like-button');
            
            // Initialize like button
            if (user && likeBtn) {
                likeBtn.style.display = 'block';
                this.setupLikeListener(likeBtn, ventureId);
            } else if (likeBtn) {
                likeBtn.style.display = 'none';
            }

            // Load comments
            this.setupCommentsListener(venture, ventureId);
        });
    }

    async handleLike(likeBtn) {
        const user = auth.currentUser;
        if (!user) {
            alert('Please login to like this venture');
            window.location.href = 'login.html';
            return;
        }

        const ventureId = likeBtn.dataset.ventureId;
        const userId = user.uid;
        const likeRef = db.ref(`likes/${ventureId}/${userId}`);

        try {
            const snapshot = await likeRef.once('value');
            if (snapshot.exists()) {
                await likeRef.remove();
            } else {
                await likeRef.set({
                    timestamp: Date.now(),
                    userId: userId
                });
            }
        } catch (error) {
            console.error('Error handling like:', error);
            alert('Failed to update like. Please try again.');
        }
    }

    setupLikeListener(likeBtn, ventureId) {
        const likesRef = db.ref(`likes/${ventureId}`);
        
        likesRef.on('value', (snapshot) => {
            const likeCount = snapshot.numChildren();
            const likeCountElement = likeBtn.querySelector('.like-count');
            
            if (likeCountElement) {
                likeCountElement.textContent = likeCount;
            }
            
            // Update heart icon if user is logged in
            const user = auth.currentUser;
            if (user) {
                const heartIcon = likeBtn.querySelector('i');
                if (snapshot.hasChild(user.uid)) {
                    heartIcon.classList.remove('far');
                    heartIcon.classList.add('fas', 'text-danger');
                } else {
                    heartIcon.classList.remove('fas', 'text-danger');
                    heartIcon.classList.add('far');
                }
            }
        });
    }

    async submitComment(form, ventureId) {
        const user = auth.currentUser;
        if (!user) {
            alert('Please login to post a comment');
            window.location.href = 'login.html';
            return;
        }

        const commentText = form.querySelector('.comment-input').value.trim();
        if (!commentText) {
            alert('Please enter a comment');
            return;
        }

        const commentsRef = db.ref(`comments/${ventureId}`).push();
        
        try {
            await commentsRef.set({
                text: commentText,
                author: user.displayName || user.email.split('@')[0],
                authorId: user.uid,
                timestamp: Date.now()
            });
            form.querySelector('.comment-input').value = '';
        } catch (error) {
            console.error('Error submitting comment:', error);
            alert('Failed to post comment. Please try again.');
        }
    }

    setupCommentsListener(venture, ventureId) {
        const commentsRef = db.ref(`comments/${ventureId}`);
        const commentsList = venture.querySelector('.comments-list');
        
        commentsRef.orderByChild('timestamp').on('value', (snapshot) => {
            if (!commentsList) return;
            
            commentsList.innerHTML = '';
            
            if (!snapshot.exists()) {
                commentsList.innerHTML = '<p>No comments yet. Be the first to comment!</p>';
                return;
            }
            
            snapshot.forEach(childSnapshot => {
                const comment = childSnapshot.val();
                const commentElement = document.createElement('div');
                commentElement.className = 'comment';
                commentElement.innerHTML = `
                    <div class="comment-author">${comment.author}</div>
                    <div class="comment-text">${comment.text}</div>
                    <div class="comment-time">${new Date(comment.timestamp).toLocaleString()}</div>
                `;
                commentsList.appendChild(commentElement);
            });
        });
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new CommentLikeSystem();
});