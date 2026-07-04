/*=============================================
  ⚽ XBZ Prime TV - Main Application
  App Initialization, Routing & Coordination
  =============================================*/

'use strict';

const XBZPrimeTV = {
    /* ==========================================
       INITIALIZATION
       ========================================== */

    /**
     * Initialize the entire application
     */
    async init() {
        console.log('========================================');
        console.log(`  ⚽ ${CONFIG.APP_NAME} v${CONFIG.APP_VERSION}`);
        console.log('  Premium Sports Live Streaming');
        console.log('========================================');

        try {
            // Record start time
            const startTime = performance.now();

            // Set up online/offline detection
            this.setupConnectivityDetection();

            // Initialize theme first (prevents flash)
            ThemeManager.init();

            // Initialize toast system
            ToastManager.init();

            // Cache all DOM elements
            this.cacheAllDOMElements();

            // Initialize UI components
            this.initUIComponents();

            // Set up keyboard shortcuts
            this.setupKeyboardShortcuts();

            // Set up bottom navigation
            this.setupBottomNavigation();

            // Set up scroll to top
            this.setupScrollToTop();

            // Set up PWA install prompt
            this.setupPWAInstall();

            // Load data
            await this.loadData();

            // Set up intersection observers
            this.setupIntersectionObservers();

            // Set up custom stream panel
            this.setupCustomStreamPanel();

            // Mark as ready
            StateManager.set('app.initialized', true);
            StateManager.set('app.ready', true);

            // Show welcome toast
            setTimeout(() => {
                ToastManager.showWelcome();
            }, 1000);

            // Record performance
            const loadTime = performance.now() - startTime;
            STATE.performance.appStartTime = startTime;
            console.log(`[APP] Initialization complete in ${loadTime.toFixed(0)}ms`);
            console.log('========================================');

            // Dispatch ready event
            Utils.triggerEvent(document.body, 'app:ready', { loadTime });

        } catch (error) {
            console.error('[APP] Critical initialization error:', error);
            StateManager.set('app.error', error.message);
            
            // Show error to user
            ToastManager.error(
                'Failed to initialize app. Please refresh the page.',
                'Initialization Error'
            );
        }
    },

    /* ==========================================
       CONNECTIVITY DETECTION
       ========================================== */

    /**
     * Set up online/offline detection
     */
    setupConnectivityDetection() {
        window.addEventListener('online', () => {
            console.log('[APP] Network connection restored');
            StateManager.set('app.online', true);
            
            // Refresh data when coming back online
            setTimeout(() => {
                this.refreshAllData();
            }, 2000);
        });

        window.addEventListener('offline', () => {
            console.log('[APP] Network connection lost');
            StateManager.set('app.online', false);
        });

        // Initial check
        StateManager.set('app.online', navigator.onLine);
    },

    /* ==========================================
       DOM CACHE
       ========================================== */

    /**
     * Cache all frequently accessed DOM elements
     */
    cacheAllDOMElements() {
        STATE.dom.elements.app = Utils.$('#app');
        STATE.dom.elements.mainContent = Utils.$('#main-content');
        STATE.dom.elements.playerSection = Utils.$('#player-section');
        STATE.dom.elements.matchesSection = Utils.$('#matches-section');
        STATE.dom.elements.channelsSection = Utils.$('#channels-section');
        STATE.dom.elements.customStreamSection = Utils.$('#custom-stream-panel');
        STATE.dom.elements.bottomNav = Utils.$('#bottom-nav');
        STATE.dom.elements.scrollToTop = Utils.$('.scroll-to-top');
        STATE.dom.elements.playerLoading = Utils.$('#player-loading');
        STATE.dom.elements.playerError = Utils.$('#player-error');
        STATE.dom.elements.playerPlaceholder = Utils.$('#player-placeholder');
        STATE.dom.elements.playerRetry = Utils.$('#player-retry');
        STATE.dom.elements.playerNextSource = Utils.$('#player-next-source');
        STATE.dom.elements.playerStop = Utils.$('#player-stop');
        STATE.dom.elements.playerCancel = Utils.$('#player-cancel');
    },

    /* ==========================================
       UI COMPONENTS INITIALIZATION
       ========================================== */

    /**
     * Initialize all UI components
     */
    initUIComponents() {
        console.log('[APP] Initializing UI components...');

        // Header (includes search, refresh, theme toggle)
        HeaderComponent.init();

        // Sidebar (category navigation)
        SidebarComponent.init();

        // Tickers (breaking news + live scores)
        TickerComponent.init();

        // Matches section
        MatchesComponent.init();

        // Channels grid
        ChannelsComponent.init();

        // Modal system
        ModalManager.init();

        // Player
        PlayerModule.init().catch(error => {
            console.error('[APP] Player initialization error:', error);
        });

        console.log('[APP] All UI components initialized');
    },

    /* ==========================================
       DATA LOADING
       ========================================== */

    /**
     * Load all application data
     */
    async loadData() {
        console.log('[APP] Loading application data...');

        try {
            // Load in parallel where possible
            const results = await Promise.allSettled([
                this.loadPlaylist(),
                this.loadFootballMatches(),
                this.loadBreakingNews(),
            ]);

            // Check results
            results.forEach((result, index) => {
                const labels = ['Playlist', 'Football Matches', 'Breaking News'];
                if (result.status === 'fulfilled') {
                    console.log(`[APP] ${labels[index]} loaded successfully`);
                } else {
                    console.error(`[APP] ${labels[index]} failed:`, result.reason);
                }
            });

            console.log('[APP] Data loading complete');
        } catch (error) {
            console.error('[APP] Error loading data:', error);
        }
    },

    /**
     * Load playlist data
     */
    async loadPlaylist() {
        try {
            await GitHubAPI.init();
            return STATE.playlist.channels;
        } catch (error) {
            console.error('[APP] Playlist load error:', error);
            throw error;
        }
    },

    /**
     * Load football matches
     */
    async loadFootballMatches() {
        try {
            await FootballAPI.init();
            return STATE.football.matches;
        } catch (error) {
            console.error('[APP] Football matches load error:', error);
            throw error;
        }
    },

    /**
     * Load breaking news
     */
    async loadBreakingNews() {
        try {
            await BreakingNewsAPI.init();
            return STATE.breakingNews.items;
        } catch (error) {
            console.error('[APP] Breaking news load error:', error);
            throw error;
        }
    },

    /**
     * Refresh all data
     */
    async refreshAllData() {
        console.log('[APP] Refreshing all data...');
        
        ToastManager.info('Refreshing all data...', 'Syncing');

        try {
            await Promise.allSettled([
                GitHubAPI.fetchPlaylist(true),
                FootballAPI.fetchMatches(true),
                BreakingNewsAPI.fetchBreakingNews(true),
            ]);

            ToastManager.success('All data refreshed', 'Updated');
            console.log('[APP] All data refreshed');
        } catch (error) {
            console.error('[APP] Refresh all error:', error);
            ToastManager.error('Some data failed to refresh', 'Refresh Error');
        }
    },

    /* ==========================================
       KEYBOARD SHORTCUTS
       ========================================== */

    /**
     * Set up keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (event) => {
            // Ignore if in input fields (except for specific shortcuts)
            const tag = event.target.tagName;
            const isInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
            
            const key = event.key.toLowerCase();
            const ctrl = event.ctrlKey || event.metaKey;
            const shift = event.shiftKey;

            // Ctrl+R - Refresh playlist
            if (ctrl && key === 'r' && !shift) {
                event.preventDefault();
                HeaderComponent.refreshPlaylist();
                return;
            }

            // Ctrl+Shift+R - Refresh all data
            if (ctrl && shift && key === 'r') {
                event.preventDefault();
                this.refreshAllData();
                return;
            }

            // Ctrl+F - Focus search
            if (ctrl && key === 'f') {
                if (!isInput) {
                    event.preventDefault();
                    HeaderComponent.openSearch();
                }
                return;
            }

            // Escape - Close modals, sidebar, search
            if (key === 'escape') {
                if (ModalManager.isAnyModalOpen()) {
                    ModalManager.closeAll();
                    return;
                }
                if (STATE.ui.sidebarOpen) {
                    SidebarComponent.close();
                    return;
                }
                if (STATE.ui.searchOpen) {
                    HeaderComponent.closeSearch();
                    return;
                }
                if (STATE.player.isFullscreen) {
                    PlayerModule.toggleFullscreen();
                    return;
                }
            }

            // Only these shortcuts work in input fields
            if (isInput) return;

            // Space - Play/Pause
            if (key === ' ' && !STATE.ui.searchOpen) {
                event.preventDefault();
                PlayerModule.togglePlay();
                return;
            }

            // F - Fullscreen
            if (key === 'f' && !ctrl) {
                PlayerModule.toggleFullscreen();
                return;
            }

            // M - Mute
            if (key === 'm' && !ctrl) {
                PlayerModule.toggleMute();
                return;
            }

            // P - Picture in Picture
            if (key === 'p' && !ctrl) {
                PlayerModule.togglePiP();
                return;
            }

            // Arrow Left - Seek backward
            if (key === 'arrowleft') {
                PlayerModule.seekBy(-10);
                return;
            }

            // Arrow Right - Seek forward
            if (key === 'arrowright') {
                PlayerModule.seekBy(10);
                return;
            }

            // Arrow Up - Volume up
            if (key === 'arrowup') {
                PlayerModule.setVolume(STATE.player.volume + 0.05);
                return;
            }

            // Arrow Down - Volume down
            if (key === 'arrowdown') {
                PlayerModule.setVolume(STATE.player.volume - 0.05);
                return;
            }

            // 1-9 - Quick channel select
            if (key >= '1' && key <= '9') {
                const index = parseInt(key) - 1;
                const channel = GitHubAPI.getChannelByIndex(index);
                if (channel) {
                    PlayerModule.playChannel(channel);
                    ToastManager.info(`Playing: ${channel.name}`, 'Quick Select');
                }
                return;
            }

            // L - Go to live matches
            if (key === 'l' && !ctrl) {
                StateManager.set('football.activeTab', 'live');
                MatchesComponent.renderMatches();
                HeaderComponent.scrollToMatches();
                return;
            }
        });

        console.log('[APP] Keyboard shortcuts set up');
    },

    /* ==========================================
       BOTTOM NAVIGATION
       ========================================== */

    /**
     * Set up bottom navigation (mobile)
     */
    setupBottomNavigation() {
        if (!STATE.dom.elements.bottomNav) return;

        const navItems = Utils.$$('.bottom-nav-item', STATE.dom.elements.bottomNav);

        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const nav = item.dataset.nav;
                if (!nav) return;

                // Update active state
                navItems.forEach(ni => ni.classList.remove('active'));
                item.classList.add('active');

                // Handle navigation
                this.handleBottomNav(nav);
            });
        });

        console.log('[APP] Bottom navigation set up');
    },

    /**
     * Handle bottom navigation actions
     * @param {string} nav - Navigation target
     */
    handleBottomNav(nav) {
        StateManager.set('app.activeView', nav);

        switch (nav) {
            case 'home':
                // Scroll to top
                window.scrollTo({ top: 0, behavior: 'smooth' });
                break;

            case 'play-url':
                // Open play URL modal
                ModalManager.openPlayUrlModal();
                break;

            case 'live':
                // Switch to live matches tab and scroll
                StateManager.set('football.activeTab', 'live');
                MatchesComponent.renderMatches();
                const matchesSection = Utils.$('#matches-section');
                if (matchesSection) {
                    matchesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
                break;

            case 'scores':
                // Scroll to matches section
                const scoresSection = Utils.$('#matches-section');
                if (scoresSection) {
                    scoresSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
                break;

            case 'menu':
                // Toggle sidebar
                SidebarComponent.toggle();
                break;
        }
    },

    /* ==========================================
       SCROLL TO TOP
       ========================================== */

    /**
     * Set up scroll to top button
     */
    setupScrollToTop() {
        // Create scroll to top button if it doesn't exist
        let scrollBtn = Utils.$('.scroll-to-top');
        
        if (!scrollBtn) {
            scrollBtn = Utils.createElement('button', {
                className: 'scroll-to-top',
                'aria-label': 'Scroll to top',
                title: 'Scroll to top',
                onClick: () => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                },
            });
            scrollBtn.innerHTML = '<i class="fas fa-chevron-up"></i>';
            document.body.appendChild(scrollBtn);
        }

        // Show/hide based on scroll position
        const handleScroll = Utils.throttle(() => {
            const scrollY = window.scrollY || window.pageYOffset;
            StateManager.set('ui.scrollPosition', scrollY);

            if (scrollY > 500) {
                scrollBtn.classList.add('visible');
            } else {
                scrollBtn.classList.remove('visible');
            }
        }, CONFIG.UI.SCROLL_THROTTLE);

        window.addEventListener('scroll', handleScroll, { passive: true });
        
        console.log('[APP] Scroll to top set up');
    },

    /* ==========================================
       PWA INSTALL
       ========================================== */

    /**
     * Set up PWA install prompt
     */
    setupPWAInstall() {
        // Listen for beforeinstallprompt
        window.addEventListener('beforeinstallprompt', (event) => {
            // Prevent default browser prompt
            event.preventDefault();
            
            // Store the event
            STATE.pwa.installPromptEvent = event;
            STATE.pwa.installable = true;

            console.log('[APP] PWA install prompt available');

            // Show install banner after delay
            if (!STATE.pwa.installBannerDismissed) {
                setTimeout(() => {
                    this.showInstallBanner();
                }, CONFIG.PWA.INSTALL_PROMPT_DELAY);
            }
        });

        // Listen for app installed
        window.addEventListener('appinstalled', () => {
            STATE.pwa.installed = true;
            STATE.pwa.installPromptEvent = null;
            
            console.log('[APP] PWA installed successfully');
            ToastManager.success('App installed successfully!', 'Installed');
            
            // Hide install banner
            this.hideInstallBanner();
        });

        console.log('[APP] PWA install handler set up');
    },

    /**
     * Show install banner
     */
    showInstallBanner() {
        if (!STATE.pwa.installable || STATE.pwa.installed) return;

        // Check if banner already exists
        if (Utils.$('.install-banner')) return;

        const banner = Utils.createElement('div', {
            className: 'install-banner',
        });

        banner.innerHTML = `
            <img src="assets/favicon.png" alt="XBZ Prime TV" class="install-banner-icon" width="40" height="40">
            <div class="install-banner-text">
                <div class="install-banner-title">Install XBZ Prime TV</div>
                <div class="install-banner-subtitle">Add to home screen for quick access</div>
            </div>
            <button class="btn btn-sm btn-primary install-btn">Install</button>
            <button class="install-banner-close" aria-label="Dismiss">
                <i class="fas fa-times"></i>
            </button>
        `;

        document.body.appendChild(banner);

        // Install button
        const installBtn = Utils.$('.install-btn', banner);
        if (installBtn) {
            installBtn.addEventListener('click', async () => {
                if (STATE.pwa.installPromptEvent) {
                    await STATE.pwa.installPromptEvent.prompt();
                    const result = await STATE.pwa.installPromptEvent.userChoice;
                    console.log(`[APP] PWA install choice: ${result.outcome}`);
                    STATE.pwa.installPromptEvent = null;
                }
                this.hideInstallBanner();
            });
        }

        // Close button
        const closeBtn = Utils.$('.install-banner-close', banner);
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.hideInstallBanner();
                STATE.pwa.installBannerDismissed = true;
                Utils.setToStorage(CONFIG.STORAGE_KEYS.INSTALL_PROMPT_SHOWN, true);
            });
        }

        console.log('[APP] Install banner shown');
    },

    /**
     * Hide install banner
     */
    hideInstallBanner() {
        const banner = Utils.$('.install-banner');
        if (banner) {
            banner.classList.add('removing');
            setTimeout(() => banner.remove(), 300);
        }
    },

    /* ==========================================
       INTERSECTION OBSERVERS
       ========================================== */

    /**
     * Set up intersection observers for lazy loading and animations
     */
    setupIntersectionObservers() {
        // Channel card reveal observer
        ChannelsComponent.setupIntersectionObserver();

        // Match card reveal observer
        MatchesComponent.setupIntersectionObserver();

        // Observe initial elements
        this.observeRevealElements();

        // Re-observe on content changes
        const observer = new MutationObserver(Utils.debounce(() => {
            this.observeRevealElements();
        }, 200));

        const grid = Utils.$('#channels-grid');
        if (grid) {
            observer.observe(grid, { childList: true, subtree: false });
        }

        const matchGrid = Utils.$('#matches-grid');
        if (matchGrid) {
            observer.observe(matchGrid, { childList: true, subtree: false });
        }

        console.log('[APP] Intersection observers set up');
    },

    /**
     * Observe all reveal elements
     */
    observeRevealElements() {
        // Channel cards
        ChannelsComponent.observeChannelCards();

        // Match cards
        const matchCards = Utils.$$('.match-card.reveal:not(.visible)');
        if (STATE.dom.observers.matchReveal) {
            matchCards.forEach(card => {
                STATE.dom.observers.matchReveal.observe(card);
            });
        }
    },

    /* ==========================================
       CUSTOM STREAM PANEL
       ========================================== */

    /**
     * Set up custom stream collapsible panel
     */
    setupCustomStreamPanel() {
        const toggle = Utils.$('#custom-stream-toggle');
        const content = Utils.$('#custom-stream-content');
        
        if (!toggle || !content) return;

        // Toggle collapse
        toggle.addEventListener('click', () => {
            const isOpen = !content.classList.contains('hidden');
            
            if (isOpen) {
                content.classList.add('hidden');
                toggle.querySelector('.chevron-icon')?.classList.remove('open');
                StateManager.set('ui.customStreamOpen', false);
            } else {
                content.classList.remove('hidden');
                toggle.querySelector('.chevron-icon')?.classList.add('open');
                StateManager.set('ui.customStreamOpen', true);
            }
        });

        // Stream tabs
        const streamTabs = Utils.$$('.stream-tab');
        streamTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.streamTab;
                
                // Update active tab
                streamTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                // Show corresponding content
                const tabContents = Utils.$$('.stream-tab-content');
                tabContents.forEach(tc => tc.classList.add('hidden'));
                
                const targetContent = Utils.$(`#stream-tab-${tabName}`);
                if (targetContent) {
                    targetContent.classList.remove('hidden');
                }
                
                StateManager.set('ui.customStreamTab', tabName);
            });
        });

        // Direct URL play button
        const directPlayBtn = Utils.$('#direct-url-play');
        const directUrlInput = Utils.$('#direct-url-input');
        
        if (directPlayBtn && directUrlInput) {
            directPlayBtn.addEventListener('click', () => {
                const url = directUrlInput.value.trim();
                if (url && Utils.isValidURL(url)) {
                    PlayerModule.playDirectUrl(url);
                } else {
                    ToastManager.error('Please enter a valid stream URL', 'Invalid URL');
                }
            });

            directUrlInput.addEventListener('keydown', (event) => {
                if (event.key === 'Enter') {
                    directPlayBtn.click();
                }
            });
        }

        // M3U load button
        const m3uLoadBtn = Utils.$('#m3u-load');
        const m3uInput = Utils.$('#m3u-input');
        
        if (m3uLoadBtn && m3uInput) {
            m3uLoadBtn.addEventListener('click', async () => {
                const content = m3uInput.value.trim();
                if (!content) {
                    ToastManager.warning('Please paste M3U content or URL', 'Empty Input');
                    return;
                }

                try {
                    let m3uText = content;
                    
                    // Check if it's a URL
                    if (Utils.isValidURL(content)) {
                        ToastManager.info('Fetching M3U playlist...', 'Loading');
                        m3uText = await Utils.fetchText(content);
                    }
                    
                    // Parse M3U
                    const channels = Utils.parseM3U(m3uText);
                    
                    if (channels.length === 0) {
                        ToastManager.error('No channels found in playlist', 'Parse Error');
                        return;
                    }
                    
                    // Add to state
                    const allChannels = [...STATE.playlist.channels, ...channels];
                    const unique = Utils.removeDuplicateChannels(allChannels);
                    
                    StateManager.set('playlist.channels', unique);
                    StateManager.set('playlist.categories', Utils.extractCategories(unique));
                    
                    ToastManager.success(
                        `${channels.length} channels loaded from M3U`,
                        'M3U Loaded'
                    );
                    
                    // Clear input
                    m3uInput.value = '';
                    
                } catch (error) {
                    console.error('[APP] M3U load error:', error);
                    ToastManager.error('Failed to load M3U playlist', 'Error');
                }
            });
        }

        // HTML Embed render button
        const embedRenderBtn = Utils.$('#embed-render');
        const embedInput = Utils.$('#embed-input');
        const embedPreview = Utils.$('#embed-preview');
        
        if (embedRenderBtn && embedInput) {
            embedRenderBtn.addEventListener('click', () => {
                const code = embedInput.value.trim();
                if (!code) {
                    ToastManager.warning('Please paste HTML embed code', 'Empty Input');
                    return;
                }

                if (!Utils.isEmbedCode(code)) {
                    ToastManager.error('No iframe found in embed code', 'Invalid Embed');
                    return;
                }

                // Render embed
                PlayerModule.playEmbed(code);
                
                // Show preview
                if (embedPreview) {
                    embedPreview.classList.remove('hidden');
                    embedPreview.innerHTML = code;
                }
                
                // Scroll to player
                const playerSection = Utils.$('#player-section');
                if (playerSection) {
                    playerSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
                
                ToastManager.success('Embed rendered', 'Success');
            });
        }

        // Player overlay buttons
        this.setupPlayerOverlayButtons();

        console.log('[APP] Custom stream panel set up');
    },

    /**
     * Set up player overlay button handlers
     */
    setupPlayerOverlayButtons() {
        // Retry button
        if (STATE.dom.elements.playerRetry) {
            STATE.dom.elements.playerRetry.addEventListener('click', () => {
                PlayerModule.showLoading();
                PlayerModule.hideError();
                
                const source = STATE.player.availableSources[STATE.player.currentSourceIndex];
                if (source) {
                    PlayerModule.playStream(source).catch(() => {
                        PlayerModule.handlePlaybackError(new Error('Retry failed'));
                    });
                }
            });
        }

        // Next source button
        if (STATE.dom.elements.playerNextSource) {
            STATE.dom.elements.playerNextSource.addEventListener('click', () => {
                PlayerModule.tryNextSource();
            });
        }

        // Stop button
        if (STATE.dom.elements.playerStop) {
            STATE.dom.elements.playerStop.addEventListener('click', () => {
                PlayerModule.stop();
            });
        }

        // Cancel loading button
        if (STATE.dom.elements.playerCancel) {
            STATE.dom.elements.playerCancel.addEventListener('click', () => {
                PlayerModule.stop();
                ToastManager.info('Playback cancelled', 'Stopped');
            });
        }
    },

    /* ==========================================
       ERROR HANDLING
       ========================================== */

    /**
     * Global error handler
     */
    setupGlobalErrorHandler() {
        window.addEventListener('error', (event) => {
            console.error('[APP] Global error:', event.error);
            
            // Don't show toast for every error, only critical ones
            if (event.error && event.error.critical) {
                ToastManager.error(
                    'Something went wrong. Please refresh the page.',
                    'Application Error'
                );
            }
        });

        window.addEventListener('unhandledrejection', (event) => {
            console.error('[APP] Unhandled promise rejection:', event.reason);
            
            // Prevent default console error
            event.preventDefault();
        });

        console.log('[APP] Global error handlers set up');
    },

    /* ==========================================
       PERFORMANCE MONITORING
       ========================================== */

    /**
     * Set up performance monitoring
     */
    setupPerformanceMonitoring() {
        // Record first paint
        if (window.performance) {
            const paintEntries = performance.getEntriesByType('paint');
            paintEntries.forEach(entry => {
                if (entry.name === 'first-paint') {
                    STATE.performance.firstPaint = entry.startTime;
                }
                if (entry.name === 'first-contentful-paint') {
                    STATE.performance.firstContentfulPaint = entry.startTime;
                }
            });

            // Observe long tasks
            if (PerformanceObserver) {
                try {
                    const observer = new PerformanceObserver((list) => {
                        for (const entry of list.getEntries()) {
                            if (entry.duration > 50) {
                                console.warn(`[PERF] Long task: ${entry.duration.toFixed(2)}ms`);
                            }
                        }
                    });
                    observer.observe({ entryTypes: ['longtask'] });
                } catch (e) {
                    // longtask may not be supported
                }
            }
        }

        console.log('[APP] Performance monitoring set up');
    },

    /* ==========================================
       CLEANUP
       ========================================== */

    /**
     * Clean up application before unload
     */
    destroy() {
        console.log('[APP] Cleaning up application...');

        // Destroy all modules
        PlayerModule.destroy();
        GitHubAPI.destroy();
        FootballAPI.destroy();
        BreakingNewsAPI.destroy();
        ThemeManager.destroy();
        ToastManager.destroy();
        HeaderComponent.destroy();
        SidebarComponent.destroy();
        TickerComponent.destroy();
        MatchesComponent.destroy();
        ChannelsComponent.destroy();
        ModalManager.destroy();

        // Clear all timers
        StateManager.clearAllTimers();

        // Abort all fetches
        StateManager.abortAllFetches();

        // Persist state
        StateManager.persistState();

        console.log('[APP] Cleanup complete');
    },
};

/* ==========================================
   APP STARTUP
   ========================================== */

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        XBZPrimeTV.init();
    });
} else {
    // DOM already ready
    XBZPrimeTV.init();
}

// Handle page unload
window.addEventListener('beforeunload', () => {
    XBZPrimeTV.destroy();
});

// Handle visibility change for performance
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Page hidden - reduce activity
        console.log('[APP] Page hidden');
    } else {
        // Page visible - resume activity
        console.log('[APP] Page visible');
        StateManager.set('app.lastActivity', Date.now());
    }
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = XBZPrimeTV;
}
