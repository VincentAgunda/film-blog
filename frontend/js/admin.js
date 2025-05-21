import { auth, onAuthStateChanged } from './auth.js';
import { tokenService, uiService } from './common.js';

const BACKEND_BASE_URL = 'https://mcmuci.onrender.com';

class AdminDashboard {
  constructor() {
    this.currentPage = null;
    this.currentSection = null;
    this.pages = [];
    this.initAuthListener();
    this.cacheElements();
    this.initEventListeners();
    this.loadPages();
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
      sectionName: document.getElementById('pageSectionName'),
      sectionContent: document.getElementById('pageSectionContent'),
      newSectionName: document.getElementById('newSectionName')
    };
  }

  initEventListeners() {
    if (this.elements.imageUploadForm) {
      this.elements.imageUploadForm.addEventListener('submit', this.handleImageUpload.bind(this));
    }

    if (this.elements.pageContentForm) {
      this.elements.pageContentForm.addEventListener('submit', this.handleContentSubmit.bind(this));
    }

    if (this.elements.selectPage) {
      this.elements.selectPage.addEventListener('change', () => {
        this.currentPage = this.elements.selectPage.value;
        this.loadPageSections();
      });
    }

    if (this.elements.sectionName) {
      this.elements.sectionName.addEventListener('change', () => {
        this.currentSection = this.elements.sectionName.value;
        this.loadSectionContent();
      });
    }
  }

  initDashboard() {
    uiService.updateHeader();
    this.loadImages();
  }

  async loadPages() {
    try {
      const response = await this.apiRequest('/api/content');
      this.pages = await response.json();
      this.populatePageDropdown();
    } catch (error) {
      console.error('Failed to load pages:', error);
      this.showStatus('Failed to load pages', 'danger');
    }
  }

  populatePageDropdown() {
    const selectPage = this.elements.selectPage;
    selectPage.innerHTML = '<option value="">Select a Page</option>';
    
    this.pages.forEach(page => {
      const option = document.createElement('option');
      option.value = page.pageName;
      option.textContent = this.formatName(page.pageName);
      selectPage.appendChild(option);
    });
  }

  async loadPageSections() {
    if (!this.currentPage) return;
    
    try {
      const page = this.pages.find(p => p.pageName === this.currentPage) || 
                   await this.apiRequest(`/api/content/${this.currentPage}`).then(res => res.json());
      
      this.populateSectionDropdown(page?.sections || []);
      this.elements.sectionContent.value = '';
    } catch (error) {
      console.error('Failed to load sections:', error);
      this.showStatus('Failed to load sections', 'danger');
    }
  }

  populateSectionDropdown(sections) {
    const sectionName = this.elements.sectionName;
    sectionName.innerHTML = '<option value="">Select a Section</option>';
    
    sections.forEach(section => {
      const option = document.createElement('option');
      option.value = section.sectionName;
      option.textContent = this.formatName(section.sectionName);
      sectionName.appendChild(option);
    });
    
    // Add option to create new section
    const newOption = document.createElement('option');
    newOption.value = 'new';
    newOption.textContent = '+ Create New Section';
    sectionName.appendChild(newOption);
  }

  async loadSectionContent() {
    if (!this.currentPage || !this.currentSection || this.currentSection === 'new') {
      this.elements.sectionContent.value = '';
      return;
    }
    
    try {
      const page = this.pages.find(p => p.pageName === this.currentPage);
      const section = page?.sections.find(s => s.sectionName === this.currentSection);
      
      if (section) {
        this.elements.sectionContent.value = section.content;
      }
    } catch (error) {
      console.error('Failed to load section content:', error);
    }
  }

  async handleContentSubmit(e) {
    e.preventDefault();
    
    const pageName = this.elements.selectPage.value;
    let sectionName = this.elements.sectionName.value;
    const content = this.elements.sectionContent.value;
    
    if (sectionName === 'new') {
      sectionName = this.elements.newSectionName.value;
    }
    
    if (!pageName || !sectionName || !content) {
      this.showStatus('Please fill all fields', 'danger');
      return;
    }
    
    try {
      const response = await this.apiRequest('/api/content', 'POST', JSON.stringify({
        pageName,
        sectionName,
        content
      }));
      
      const result = await response.json();
      this.showStatus('Content saved successfully!', 'success');
      
      // Refresh the page and section data
      this.loadPages();
      this.elements.newSectionName.value = '';
    } catch (error) {
      console.error('Content save failed:', error);
      this.showStatus('Failed to save content', 'danger');
    }
  }

  // ... (keep existing image handling methods)

  formatName(name) {
    return name.split(/[-_]/).map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  showStatus(message, type) {
    this.elements.contentStatus.textContent = message;
    this.elements.contentStatus.className = `alert alert-${type}`;
    setTimeout(() => {
      this.elements.contentStatus.textContent = '';
      this.elements.contentStatus.className = '';
    }, 5000);
  }

  apiRequest(url, method = 'GET', body = null) {
    const headers = {
      'Authorization': `Bearer ${tokenService.get()}`
    };
    
    if (body && !(body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    return fetch(`${BACKEND_BASE_URL}${url}`, {
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

document.addEventListener('DOMContentLoaded', () => new AdminDashboard());