/*=============================================
  ⚽ XBZ Prime TV - Modal Component
  Source Switcher & Generic Modal System
  =============================================*/

'use strict';

const ModalManager = {
    /* ==========================================
       DOM ELEMENTS
       ========================================== */

    elements: {
        sourceModal: null,
        sourceModalBackdrop: null,
        sourceModalClose: null,
        sourceList: null,
        sourceModalTitle: null,
    },

    /* ==========================================
       INITIALIZATION
       ========================================== */

    /**
     * Initialize modal system
     */
    init() {
        console.log('[MODAL] Initializing modal system...');

        try {
            // Cache DOM elements
            this.cacheElements();

            // Set up event listeners
            this.setupEventListeners();

            console.log('[MODAL] Modal system initialized');
        } catch (error) {
            console.error('[MODAL] Initialization error:', error);
        }
    },

    /**
     * Cache modal DOM elements
     */
    cacheElements() {
        this.elements.sourceModal = Utils.$('#source-modal');
        this.elements.sourceModalBackdrop = Utils.$('.modal-backdrop', this.elements.sourceModal);
        this.elements.sourceModalClose = Utils.$('.modal-close', this.elements.sourceModal);
        this.elements.sourceList = Utils.$('#source-list');
        this.elements.sourceModalTitle = Utils.$('#source-modal-title');

        // Source switch button
        const sourceSwitchBtn = Utils.$('#source-switch-btn');
        if (sourceSwitchBtn) {
            sourceSwitchBtn.addEventListener('click', () => {
                this.openSourceModal();
            });
        }
    },

    /* ==========================================
       EVENT LISTENERS
       ========================================== */

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Close button
        if (this.elements.sourceModalClose) {
            this.elements.sourceModalClose.addEventListener('click', () => {
                this.closeSourceModal();
            });
        }

        // Backdrop click to close
        if (this.elements.sourceModalBackdrop) {
            this.elements.sourceModalBackdrop.addEventListener('click', () => {
                this.closeSourceModal();
            });
        }

        // Source list delegation
        if (this.elements.sourceList) {
            this.elements.sourceList.addEventListener('click', (event) => {
                const sourceItem = event.target.closest('.source-item');
                if (sourceItem) {
                    const sourceIndex = parseInt(sourceItem.dataset.sourceIndex);
                    if (!isNaN(sourceIndex)) {
                        this.switchToSource(sourceIndex);
                    }
                }
            });
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (event) => {
            // Escape to close
            if (event.key === 'Escape' && STATE.ui.sourceModalOpen) {
                this.closeSourceModal();
            }
        });

        // Close on player source change
        document.body.addEventListener('statechange', (event) => {
            if (event.detail?.path === 'player.currentSourceIndex') {
                this.updateActiveSource();
            }
        });
    },

    /* ==========================================
       SOURCE MODAL
       ========================================== */

    /**
     * Open source switcher modal
     */
    openSourceModal() {
        if (!this.elements.sourceModal) return;

        const sources = STATE.player.availableSources;
        
        if (sources.length === 0) {
            ToastManager.info('No alternative sources available', 'Sources');
            return;
        }

        // Render source list
        this.renderSourceList(sources);

        // Show modal
        this.elements.sourceModal.classList.remove('hidden');
        StateManager.set('ui.sourceModalOpen', true);
        StateManager.set('ui.activeModal', 'source');

        // Prevent body scroll
        document.body.style.overflow = 'hidden';

        // Focus trap
        this.trapFocus(this.elements.sourceModal);

        console.log('[MODAL] Source modal opened');
    },

    /**
     * Close source switcher modal
     */
    closeSourceModal() {
        if (!this.elements.sourceModal) return;

        this.elements.sourceModal.classList.add('hidden');
        StateManager.set('ui.sourceModalOpen', false);
        StateManager.set('ui.activeModal', null);

        // Restore body scroll
        document.body.style.overflow = '';

        console.log('[MODAL] Source modal closed');
    },

    /**
     * Render source list in modal
     * @param {Array} sources - Available sources
     */
    renderSourceList(sources) {
        if (!this.elements.sourceList) return;

        // Update title
        if (this.elements.sourceModalTitle) {
            const channelName = STATE.player.currentChannel?.name || 'Current Channel';
            this.elements.sourceModalTitle.textContent = `Stream Sources - ${channelName}`;
        }

        // Clear list
        Utils.emptyElement(this.elements.sourceList);

        // Render sources
        sources.forEach((source, index) => {
            const isActive = index === STATE.player.currentSourceIndex;
            const item = this.createSourceItem(source, index, isActive);
            this.elements.sourceList.appendChild(item);
        });

        console.log(`[MODAL] Rendered ${sources.length} sources`);
    },

    /**
     * Create a source list item
     * @param {Object} source - Source data
     * @param {number} index - Source index
     * @param {boolean} isActive - Is currently active
     * @returns {Element} Source item element
     */
    createSourceItem(source, index, isActive) {
        const item = Utils.createElement('li', {
            className: `source-item ${isActive ? 'active' : ''}`,
            dataset: { sourceIndex: index },
            title: `Switch to ${source.label}`,
        });

        // Source info
        const info = Utils.createElement('div', {
            className: 'source-item-info',
        });

        // Quality badge
        const qualityBadge = Utils.createElement('span', {
            className: 'source-quality-badge',
            text: source.quality || 'HD',
        });

        if (source.quality === '4K') {
            qualityBadge.classList.add('badge-4k');
        } else if (source.quality === 'HD' || source.quality === 'FHD') {
            qualityBadge.classList.add('badge-hd');
        } else {
            qualityBadge.classList.add('badge-sd');
        }

        // URL display
        const urlDisplay = Utils.createElement('span', {
            className: 'source-url',
            text: source.label || Utils.truncate(source.url, 60),
        });

        info.appendChild(qualityBadge);
        info.appendChild(urlDisplay);

        // Select button
        const selectBtn = Utils.createElement('span', {
            className: 'source-select-btn',
        });

        if (isActive) {
            selectBtn.innerHTML = '<i class="fas fa-check-circle"></i> Active';
            selectBtn.style.color = 'var(--color-success)';
        } else {
            selectBtn.textContent = 'Select';
        }

        item.appendChild(info);
        item.appendChild(selectBtn);

        return item;
    },

    /**
     * Switch to a specific source
     * @param {number} sourceIndex - Source index to switch to
     */
    async switchToSource(sourceIndex) {
        try {
            console.log(`[MODAL] Switching to source ${sourceIndex}`);

            // Close modal first
            this.closeSourceModal();

            // Switch source
            await PlayerModule.switchSource(sourceIndex);

            // Show toast
            const source = STATE.player.availableSources[sourceIndex];
            const label = source?.label || `Source ${sourceIndex + 1}`;
            ToastManager.showSourceSwitched(label);

        } catch (error) {
            console.error('[MODAL] Error switching source:', error);
            ToastManager.error('Failed to switch source', 'Error');
        }
    },

    /**
     * Update active source indicator
     */
    updateActiveSource() {
        if (!this.elements.sourceList) return;

        const items = Utils.$$('.source-item', this.elements.sourceList);
        const currentIndex = STATE.player.currentSourceIndex;

        items.forEach((item, index) => {
            const selectBtn = Utils.$('.source-select-btn', item);
            
            if (index === currentIndex) {
                item.classList.add('active');
                if (selectBtn) {
                    selectBtn.innerHTML = '<i class="fas fa-check-circle"></i> Active';
                    selectBtn.style.color = 'var(--color-success)';
                }
            } else {
                item.classList.remove('active');
                if (selectBtn) {
                    selectBtn.textContent = 'Select';
                    selectBtn.style.color = '';
                }
            }
        });
    },

    /* ==========================================
       GENERIC MODAL SYSTEM
       ========================================== */

    /**
     * Create a generic modal
     * @param {Object} options - Modal options
     * @returns {Element} Modal element
     */
    createModal(options = {}) {
        const {
            id = Utils.generateId('modal'),
            title = '',
            content = '',
            showClose = true,
            onClose = null,
            className = '',
        } = options;

        // Create modal
        const modal = Utils.createElement('div', {
            id,
            className: `modal ${className}`,
            role: 'dialog',
            'aria-modal': 'true',
            'aria-labelledby': `${id}-title`,
        });

        // Backdrop
        const backdrop = Utils.createElement('div', {
            className: 'modal-backdrop',
            onClick: () => this.closeModal(id, onClose),
        });

        // Content
        const modalContent = Utils.createElement('div', {
            className: 'modal-content',
        });

        // Header
        const header = Utils.createElement('div', {
            className: 'modal-header',
        });

        const titleEl = Utils.createElement('h3', {
            id: `${id}-title`,
            className: 'modal-title',
            text: title,
        });
        header.appendChild(titleEl);

        if (showClose) {
            const closeBtn = Utils.createElement('button', {
                className: 'modal-close',
                'aria-label': 'Close modal',
                onClick: () => this.closeModal(id, onClose),
            });
            closeBtn.innerHTML = '<i class="fas fa-times"></i>';
            header.appendChild(closeBtn);
        }

        // Body
        const body = Utils.createElement('div', {
            className: 'modal-body',
        });

        if (typeof content === 'string') {
            body.innerHTML = content;
        } else if (content instanceof Element) {
            body.appendChild(content);
        }

        modalContent.appendChild(header);
        modalContent.appendChild(body);
        modal.appendChild(backdrop);
        modal.appendChild(modalContent);

        return modal;
    },

    /**
     * Open a generic modal
     * @param {string|Element} modal - Modal ID or element
     */
    openModal(modal) {
        let modalEl;
        
        if (typeof modal === 'string') {
            modalEl = document.getElementById(modal);
        } else {
            modalEl = modal;
        }

        if (!modalEl) return;

        modalEl.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        this.trapFocus(modalEl);

        console.log(`[MODAL] Opened modal: ${modalEl.id}`);
    },

    /**
     * Close a generic modal
     * @param {string|Element} modal - Modal ID or element
     * @param {Function} callback - Optional callback
     */
    closeModal(modal, callback = null) {
        let modalEl;

        if (typeof modal === 'string') {
            modalEl = document.getElementById(modal);
        } else {
            modalEl = modal;
        }

        if (!modalEl) return;

        modalEl.classList.add('hidden');
        document.body.style.overflow = '';

        if (callback && typeof callback === 'function') {
            callback();
        }

        console.log(`[MODAL] Closed modal: ${modalEl.id}`);
    },

    /**
     * Remove a modal from DOM
     * @param {string} modalId - Modal ID
     */
    removeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.remove();
            document.body.style.overflow = '';
            console.log(`[MODAL] Removed modal: ${modalId}`);
        }
    },

    /* ==========================================
       CUSTOM STREAM MODAL INTEGRATION
       ========================================== */

    /**
     * Show custom stream URL input as modal
     */
    openPlayUrlModal() {
        const content = Utils.createElement('div', {
            className: 'play-url-modal-content',
        });

        content.innerHTML = `
            <div class="stream-input-group" style="flex-direction: column;">
                <input 
                    type="url" 
                    id="modal-stream-url" 
                    class="stream-input" 
                    placeholder="Enter stream URL (m3u8, mp4, ts, mpd)..." 
                    aria-label="Stream URL"
                    style="width: 100%;"
                >
                <button id="modal-play-btn" class="btn btn-primary btn-block">
                    <i class="fas fa-play"></i> Play Stream
                </button>
            </div>
        `;

        const modal = this.createModal({
            id: 'play-url-modal',
            title: 'Play Custom URL',
            content,
            onClose: () => this.removeModal('play-url-modal'),
        });

        document.body.appendChild(modal);
        this.openModal(modal);

        // Focus input
        setTimeout(() => {
            const input = Utils.$('#modal-stream-url');
            if (input) input.focus();
        }, 300);

        // Set up play button
        const playBtn = Utils.$('#modal-play-btn');
        const urlInput = Utils.$('#modal-stream-url');

        if (playBtn && urlInput) {
            playBtn.addEventListener('click', () => {
                const url = urlInput.value.trim();
                if (url && Utils.isValidURL(url)) {
                    this.closeModal('play-url-modal');
                    PlayerModule.playDirectUrl(url);
                } else {
                    ToastManager.error('Please enter a valid stream URL', 'Invalid URL');
                }
            });

            // Enter key support
            urlInput.addEventListener('keydown', (event) => {
                if (event.key === 'Enter') {
                    playBtn.click();
                }
            });
        }
    },

    /* ==========================================
       ACCESSIBILITY
       ========================================== */

    /**
     * Trap focus within a modal
     * @param {Element} modal - Modal element
     */
    trapFocus(modal) {
        const focusableElements = Utils.$$(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
            modal
        );

        const firstFocusable = focusableElements[0];
        const lastFocusable = focusableElements[focusableElements.length - 1];

        if (firstFocusable) {
            firstFocusable.focus();
        }

        modal.addEventListener('keydown', function handleTab(event) {
            if (event.key === 'Tab') {
                if (event.shiftKey) {
                    if (document.activeElement === firstFocusable) {
                        event.preventDefault();
                        lastFocusable?.focus();
                    }
                } else {
                    if (document.activeElement === lastFocusable) {
                        event.preventDefault();
                        firstFocusable?.focus();
                    }
                }
            }
        });
    },

    /* ==========================================
       MODAL STATUS
       ========================================== */

    /**
     * Check if any modal is open
     * @returns {boolean}
     */
    isAnyModalOpen() {
        return STATE.ui.sourceModalOpen || STATE.ui.activeModal !== null;
    },

    /**
     * Close all open modals
     */
    closeAll() {
        this.closeSourceModal();
        
        // Close any generic modals
        const openModals = Utils.$$('.modal:not(.hidden)');
        openModals.forEach(modal => {
            modal.classList.add('hidden');
        });
        
        document.body.style.overflow = '';
        StateManager.set('ui.activeModal', null);
        
        console.log('[MODAL] All modals closed');
    },

    /* ==========================================
       CLEANUP
       ========================================== */

    /**
     * Clean up modal system
     */
    destroy() {
        this.closeAll();
        
        // Remove any dynamically created modals
        const dynamicModals = Utils.$$('.modal[id^="xbz-"]');
        dynamicModals.forEach(modal => modal.remove());
        
        console.log('[MODAL] Modal system destroyed');
    },
};

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ModalManager;
}
