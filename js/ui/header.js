/*=============================================
  ⚽ XBZ Prime TV - Header Component
  Sticky Header with Search, Refresh & Navigation
  =============================================*/

'use strict';

const HeaderComponent = {
    /* ==========================================
       DOM ELEMENTS
       ========================================== */

    elements: {
        header: null,
        hamburgerBtn: null,
        searchToggle: null,
        searchBar: null,
        searchInput: null,
        searchClose: null,
        refreshBtn: null,
        themeToggle: null,
        liveBadge: null,
        liveDot: null,
        liveText: null,
    },

    /* ==========================================
       INITIALIZATION
       ========================================== */

    /**
     * Initialize header component
     */
    init() {
        console.log('[HEADER] Initializing header component...');

        try {
            // Cache DOM elements
            this.cacheElements();

            // Set up event listeners
            this.setupEventListeners();

            // Set up search functionality
            this.setupSearch();

            // Update live badge
            this.updateLiveBadge();

            // Listen for state changes
            this.setupStateListeners();

            console.log('[HEADER] Header component initialized');
        } catch (error) {
            console.error('[HEADER] Initialization error:', error);
        }
    },

    /**
     * Cache all header DOM elements
     */
    cacheElements() {
        this.elements.header = Utils.$('#header');
        this.elements.hamburgerBtn = Utils.$('#hamburger-btn');
        this.elements.searchToggle = Utils.$('#search-toggle');
        this.elements.searchBar = Utils.$('#search-bar');
        this.elements.searchInput = Utils.$('#search-input');
        this.elements.searchClose = Utils.$('#search-close');
        this.elements.refreshBtn = Utils.$('#refresh-btn');
        this.elements.themeToggle = Utils.$('#theme-toggle');
        this.elements.liveBadge = Utils.$('#live-badge');
        this.elements.liveDot = Utils.$('.live-dot');
        this.elements.liveText = Utils.$('.live-text');
    },

    /* ==========================================
       EVENT LISTENERS
       ========================================== */

    /**
     * Set up all header event listeners
     */
    setupEventListeners() {
        // Hamburger menu
        if (this.elements.hamburgerBtn) {
            this.elements.hamburgerBtn.addEventListener('click', () => {
                this.toggleSidebar();
            });
        }

        // Search toggle
        if (this.elements.searchToggle) {
            this.elements.searchToggle.addEventListener('click', () => {
                this.toggleSearch();
            });
        }

        // Search close
        if (this.elements.searchClose) {
            this.elements.searchClose.addEventListener('click', () => {
                this.closeSearch();
            });
        }

        // Refresh button
        if (this.elements.refreshBtn) {
            this.elements.refreshBtn.addEventListener('click', () => {
                this.refreshPlaylist();
            });
        }

        // Theme toggle
        if (this.elements.themeToggle) {
            this.elements.themeToggle.addEventListener('click', () => {
                ThemeManager.toggleTheme();
            });
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (event) => {
            // Ctrl+F or / to focus search
            if ((event.ctrlKey && event.key === 'f') || (event.key === '/' && !event.ctrlKey && !event.metaKey)) {
                if (document.activeElement !== this.elements.searchInput) {
                    event.preventDefault();
                    this.openSearch();
                    if (this.elements.searchInput) {
                        this.elements.searchInput.focus();
                    }
                }
            }

            // Ctrl+R to refresh playlist
            if (event.ctrlKey && event.key === 'r') {
                event.preventDefault();
                this.refreshPlaylist();
            }

            // Escape to close search/sidebar
            if (event.key === 'Escape') {
                if (STATE.ui.searchOpen) {
                    this.closeSearch();
                }
                if (STATE.ui.sidebarOpen) {
                    this.closeSidebar();
                }
            }
        });

        // Handle click outside search
        document.addEventListener('click', (event) => {
            if (STATE.ui.searchOpen) {
                const searchBar = this.elements.searchBar;
                const searchToggle = this.elements.searchToggle;
                
                if (searchBar && !searchBar.contains(event.target) && 
                    searchToggle && !searchToggle.contains(event.target)) {
                    this.closeSearch();
                }
            }
        });
    },

    /**
     * Set up search functionality
     */
    setupSearch() {
        if (!this.elements.searchInput) return;

        // Debounced search input
        const debouncedSearch = Utils.debounce((query) => {
            this.performSearch(query);
        }, CONFIG.UI.SEARCH_DEBOUNCE);

        this.elements.searchInput.addEventListener('input', (event) => {
            const query = event.target.value;
            debouncedSearch(query);
        });

        // Handle Enter key
        this.elements.searchInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                const query = event.target.value;
                this.performSearch(query);
                
                // Close search on mobile after Enter
                if (Utils.isMobile()) {
                    this.closeSearch();
                }
            }
        });
    },

    /**
     * Set up state change listeners
     */
    setupStateListeners() {
        // Listen for playlist updates
        document.body.addEventListener('playlist:loaded', (event) => {
            this.updateLiveBadge();
            this.stopRefreshAnimation();
            
            const count = event.detail?.count || 0;
            ToastManager.showPlaylistLoaded(count);
        });

        // Listen for match updates
        document.body.addEventListener('football:loaded', (event) => {
            this.updateLiveBadge();
        });

        // Listen for player events
        document.body.addEventListener('player:playing', () => {
            this.updateLiveBadge();
        });
    },

    /* ==========================================
       SEARCH FUNCTIONALITY
       ========================================== */

    /**
     * Toggle search bar visibility
     */
    toggleSearch() {
        if (STATE.ui.searchOpen) {
            this.closeSearch();
        } else {
            this.openSearch();
        }
    },

    /**
     * Open search bar
     */
    openSearch() {
        if (!this.elements.searchBar) return;

        this.elements.searchBar.classList.remove('hidden');
        StateManager.set('ui.searchOpen', true);

        // Focus input after animation
        setTimeout(() => {
            if (this.elements.searchInput) {
                this.elements.searchInput.focus();
            }
        }, 150);

        // Update toggle button
        if (this.elements.searchToggle) {
            this.elements.searchToggle.classList.add('active');
        }
    },

    /**
     * Close search bar
     */
    closeSearch() {
        if (!this.elements.searchBar) return;

        this.elements.searchBar.classList.add('hidden');
        StateManager.set('ui.searchOpen', false);

        // Clear search input
        if (this.elements.searchInput) {
            this.elements.searchInput.value = '';
            this.elements.searchInput.blur();
        }

        // Clear search results
        this.clearSearch();

        // Update toggle button
        if (this.elements.searchToggle) {
            this.elements.searchToggle.classList.remove('active');
        }
    },

    /**
     * Perform channel search
     * @param {string} query - Search query
     */
    performSearch(query) {
        try {
            // Update state
            StateManager.set('playlist.searchQuery', query);

            // Scroll to channels section if search is active
            if (query.trim()) {
                const channelsSection = Utils.$('#channels-section');
                if (channelsSection && Utils.isMobile()) {
                    channelsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }

            // Log search
            if (query.trim()) {
                console.log(`[HEADER] Search: "${query}" - ${STATE.playlist.filteredCount} results`);
            }
        } catch (error) {
            console.error('[HEADER] Search error:', error);
        }
    },

    /**
     * Clear search results
     */
    clearSearch() {
        StateManager.set('playlist.searchQuery', '');
        if (this.elements.searchInput) {
            this.elements.searchInput.value = '';
        }
    },

    /* ==========================================
       REFRESH FUNCTIONALITY
       ========================================== */

    /**
     * Refresh playlist data
     */
    async refreshPlaylist() {
        try {
            console.log('[HEADER] Manual playlist refresh triggered');

            // Show refresh animation
            this.startRefreshAnimation();

            // Show loading toast
            const toastId = ToastManager.loading('Refreshing channels...', 'Updating');

            // Fetch fresh playlist
            await GitHubAPI.fetchPlaylist(true);

            // Update UI
            this.updateLiveBadge();
            this.stopRefreshAnimation();

            // Dismiss loading toast
            ToastManager.dismissLoading(toastId);

            // Show success
            ToastManager.success(
                `Playlist refreshed. ${Utils.formatNumber(STATE.playlist.totalCount)} channels available.`,
                'Refreshed'
            );

        } catch (error) {
            console.error('[HEADER] Refresh error:', error);
            this.stopRefreshAnimation();
            ToastManager.error('Failed to refresh playlist. Please try again.', 'Refresh Failed');
        }
    },

    /**
     * Start refresh button animation
     */
    startRefreshAnimation() {
        if (this.elements.refreshBtn) {
            const icon = Utils.$('i', this.elements.refreshBtn);
            if (icon) {
                icon.classList.add('fa-spin');
            }
            this.elements.refreshBtn.disabled = true;
        }
    },

    /**
     * Stop refresh button animation
     */
    stopRefreshAnimation() {
        if (this.elements.refreshBtn) {
            const icon = Utils.$('i', this.elements.refreshBtn);
            if (icon) {
                icon.classList.remove('fa-spin');
            }
            this.elements.refreshBtn.disabled = false;
        }
    },

    /* ==========================================
       LIVE BADGE
       ========================================== */

    /**
     * Update live badge status
     */
    updateLiveBadge() {
        try {
            if (!this.elements.liveBadge) return;

            const liveMatchesCount = STATE.football.liveMatches.length;
            const liveChannelsCount = STATE.playlist.channels.filter(ch => ch.isLive).length;
            const hasLiveContent = liveMatchesCount > 0 || liveChannelsCount > 0;
            const isPlaying = STATE.player.isPlaying;

            // Show/hide badge
            if (hasLiveContent || isPlaying) {
                this.elements.liveBadge.classList.remove('hidden');
                
                // Update pulse animation
                if (this.elements.liveDot) {
                    this.elements.liveDot.style.animationPlayState = 'running';
                }

                // Update text
                if (this.elements.liveText) {
                    if (liveMatchesCount > 0) {
                        this.elements.liveText.textContent = `${liveMatchesCount} LIVE`;
                    } else if (liveChannelsCount > 0) {
                        this.elements.liveText.textContent = 'LIVE';
                    } else {
                        this.elements.liveText.textContent = 'ON AIR';
                    }
                }
            } else {
                // Keep badge visible but dim
                if (this.elements.liveDot) {
                    this.elements.liveDot.style.animationPlayState = 'paused';
                }
                if (this.elements.liveText) {
                    this.elements.liveText.textContent = 'XBZ';
                }
            }
        } catch (error) {
            console.error('[HEADER] Error updating live badge:', error);
        }
    },

    /* ==========================================
       SIDEBAR TOGGLE
       ========================================== */

    /**
     * Toggle sidebar visibility
     */
    toggleSidebar() {
        if (STATE.ui.sidebarOpen) {
            this.closeSidebar();
        } else {
            this.openSidebar();
        }
    },

    /**
     * Open sidebar
     */
    openSidebar() {
        StateManager.set('ui.sidebarOpen', true);
        
        if (this.elements.hamburgerBtn) {
            this.elements.hamburgerBtn.classList.add('active');
        }
    },

    /**
     * Close sidebar
     */
    closeSidebar() {
        StateManager.set('ui.sidebarOpen', false);
        
        if (this.elements.hamburgerBtn) {
            this.elements.hamburgerBtn.classList.remove('active');
        }
    },

    /* ==========================================
       HEADER ACTIONS
       ========================================== */

    /**
     * Scroll to player section
     */
    scrollToPlayer() {
        const playerSection = Utils.$('#player-section');
        if (playerSection) {
            playerSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    },

    /**
     * Scroll to matches section
     */
    scrollToMatches() {
        const matchesSection = Utils.$('#matches-section');
        if (matchesSection) {
            matchesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    },

    /**
     * Scroll to channels section
     */
    scrollToChannels() {
        const channelsSection = Utils.$('#channels-section');
        if (channelsSection) {
            channelsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    },

    /* ==========================================
       HEADER STATUS
       ========================================== */

    /**
     * Get header height
     * @returns {number} Header height in pixels
     */
    getHeight() {
        return this.elements.header ? this.elements.header.offsetHeight : CONFIG.HEADER_HEIGHT;
    },

    /**
     * Check if search is open
     * @returns {boolean}
     */
    isSearchOpen() {
        return STATE.ui.searchOpen;
    },

    /* ==========================================
       CLEANUP
       ========================================== */

    /**
     * Clean up header component
     */
    destroy() {
        this.closeSearch();
        this.closeSidebar();
        console.log('[HEADER] Header component destroyed');
    },
};

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HeaderComponent;
}
