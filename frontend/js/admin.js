import { auth, onAuthStateChanged } from './auth.js';
import { tokenService, uiService } from './common.js';

class AdminDashboard {
  constructor() {
    this.initAuthListener();
    this.cacheElements();
    this.initEventListeners();
  }

  initAuthListener() {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const idToken = await user.getIdTokenResult(true);
          if (!idToken.claims.admin) this.redirectToLogin();
          else this.initDashboard();
        } catch (error) {
          console.error('Admin verification failed:', error);
          this.redirectToLogin();
        }
      } else {
        this.redirectToLogin();
      }
    });
  }

  cacheElements() {
    this.elements = {
      imageUploadForm: document.getElementById('imageUploadForm'),
      imageList: document.getElementById('imageList'),
      pageContentForm: document.getElementById('pageContentForm'),
      contentStatus: document.getElementById('pageContentStatus'),
      selectPage: document.getElementById('selectPage'),
      sectionName: document.getElementById('pageSectionName')
    };
  }

  initEventListeners() {
    if (this.elements.imageUploadForm) {
      this.elements.imageUploadForm.addEventListener('submit', this.handleImageUpload.bind(this));
    }
    
    if (this.elements.pageContentForm) {
      this.elements.pageContentForm.addEventListener('submit', this.handleContentSubmit.bind(this));
    }
  }

  initDashboard() {
    uiService.updateHeader();
    this.loadImages();
    this.loadPageContent();
  }

  async loadImages() {
    try {
      const response = await this.apiRequest('/api/admin/images');
      this.renderImages(await response.json());
    } catch (error) {
      console.error('Failed to load images:', error);
      this.elements.imageList.innerHTML = '<p class="text-danger">Failed to load images</p>';
    }
  }

  renderImages(images) {
    this.elements.imageList.innerHTML = images.length ? 
      images.map(img => this.createImageCard(img)).join('') : 
      '<p>No images available</p>';
      
    this.addDeleteHandlers();
  }

  createImageCard(image) {
    return `
      <div class="col-md-3 mb-4">
        <div class="card h-100">
          <img src="${image.url}" class="card-img-top" alt="${image.description}" style="height: 150px; object-fit: cover;">
          <div class="card-body">
            <h5 class="card-title">${image.filename.substring(0, 20)}...</h5>
            <p class="card-text">${image.description || 'No description'}</p>
            <button class="btn btn-danger btn-sm delete-btn" data-id="${image._id}">Delete</button>
          </div>
        </div>
      </div>
    `;
  }

  addDeleteHandlers() {
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        if (confirm('Are you sure?')) {
          try {
            await this.apiRequest(`/api/admin/images/${e.target.dataset.id}`, 'DELETE');
            this.loadImages();
          } catch (error) {
            console.error('Delete failed:', error);
            alert('Failed to delete image');
          }
        }
      });
    });
  }

  async handleImageUpload(e) {
    e.preventDefault();
    const formData = new FormData(this.elements.imageUploadForm);
    
    try {
      await this.apiRequest('/api/admin/images', 'POST', formData);
      this.elements.imageUploadForm.reset();
      this.loadImages();
      uiService.showMessage('message', 'Image uploaded successfully!', 'success');
    } catch (error) {
      console.error('Upload failed:', error);
      uiService.showMessage('message', 'Failed to upload image', 'danger');
    }
  }

  async handleContentSubmit(e) {
    e.preventDefault();
    const data = {
      pageName: this.elements.selectPage.value,
      title: this.elements.sectionName.value,
      content: document.getElementById('pageSectionContent').value
    };
    
    try {
      await this.apiRequest('/api/admin/content', 'POST', JSON.stringify(data));
      this.showStatus('Content saved successfully!', 'success');
    } catch (error) {
      console.error('Content save failed:', error);
      this.showStatus('Failed to save content', 'danger');
    }
  }

  showStatus(message, type) {
    this.elements.contentStatus.textContent = message;
    this.elements.contentStatus.className = `alert alert-${type}`;
  }

  apiRequest(url, method = 'GET', body = null) {
    const headers = {
      'Authorization': `Bearer ${tokenService.get()}`
    };
    
    if (body && !(body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    return fetch(url, {
      method,
      headers,
      body: body instanceof FormData ? body : body
    }).then(response => {
      if (!response.ok) throw new Error('Request failed');
      return response;
    });
  }

  redirectToLogin() {
    window.location.href = '/login.html';
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => new AdminDashboard());