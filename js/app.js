/*=============================================
  XBZ Prime TV - Main Application
  App Initialization, Routing & Coordination
  =============================================*/

'use strict';

var XBZPrimeTV = {
    /* ==========================================
       INITIALIZATION
       ========================================== */

    /**
     * Initialize the entire application
     */
    init: async function() {
        console.log('========================================');
        console.log('  XBZ Prime TV v' + CONFIG.APP_VERSION);
        console.log('  Premium Sports Live Streaming');
        console.log('========================================');
        console.log('[APP] Environment:', CONFIG.IS_LOCAL ? 'LOCAL' : 'PRODUCTION');
        console.log('[APP] Hostname:', window.location.hostname);
        console.log('[APP] CORS Proxy:', CONFIG.CORS_PROXY || 'None (Direct)');
        console.log('[APP] User Agent:', navigator.userAgent);
        console.log('[APP] Screen:', window.innerWidth + 'x' + window.innerHeight);

        try {
            var startTime = performance.now();

            this.setupConnectivityDetection();
            
            console.log('[APP] Initializing Theme Manager...');
            ThemeManager.init();
            
            console.log('[APP] Initializing Toast System...');
            ToastManager.init();
            
            console.log('[APP] Caching DOM elements...');
            this.cacheAllDOMElements();
            
            console.log('[APP] Initializing UI Components...');
            this.initUIComponents();
            
            console.log('[APP] Setting up keyboard shortcuts...');
            this.setupKeyboardShortcuts();
            
            console.log('[APP] Setting up bottom navigation...');
            this.setupBottomNavigation();
            
            console.log('[APP] Setting up scroll to top...');
            this.setupScrollToTop();
            
            console.log('[APP] Setting up PWA install...');
            this.setupPWAInstall();

            console.log('[APP] Loading data...');
            await this.loadData();

            console.log('[APP] Setting up intersection observers...');
            this.setupIntersectionObservers();
            
            console.log('[APP] Setting up custom stream panel...');
            this.setupCustomStreamPanel();

            StateManager.set('app.initialized', true);
            StateManager.set('app.ready', true);

            setTimeout(function() {
                ToastManager.showWelcome();
            }, 1000);

            var loadTime = performance.now() - startTime;
            STATE.performance.appStartTime = startTime;
            console.log('[APP] ========================================');
            console.log('[APP] Initialization complete in ' + loadTime.toFixed(0) + 'ms');
            console.log('[APP] ========================================');

            Utils.triggerEvent(document.body, 'app:ready', { loadTime: loadTime });

        } catch (error) {
            console.error('[APP] ========================================');
            console.error('[APP] CRITICAL INITIALIZATION ERROR');
            console.error('[APP] Error:', error.message);
            console.error('[APP] Stack:', error.stack);
            console.error('[APP] ========================================');
            StateManager.set('app.error', error.message);
            
            ToastManager.error(
                'Failed to initialize app. Please refresh the page.',
                'Initialization Error'
            );
        }
    },

    /* ==========================================
       CONNECTIVITY DETECTION
       ========================================== */

    setupConnectivityDetection: function() {
        var self = this;
        
        window.addEventListener('online', function() {
            console.log('[APP] Network: ONLINE');
            StateManager.set('app.online', true);
            setTimeout(function() {
                self.refreshAllData();
            }, 2000);
        });

        window.addEventListener('offline', function() {
            console.log('[APP] Network: OFFLINE');
            StateManager.set('app.online', false);
        });

        StateManager.set('app.online', navigator.onLine);
        console.log('[APP] Initial network status:', navigator.onLine ? 'ONLINE' : 'OFFLINE');
    },

    /* ==========================================
       DOM CACHE
       ========================================== */

    cacheAllDOMElements: function() {
        STATE.dom.elements.app = Utils.$('#app');
        STATE.dom.elements.mainContent = Utils.$('#main-content');
        STATE.dom.elements.playerSection = Utils.$('#player-section');
        STATE.dom.elements.matchesSection = Utils.$('#matches-section');
        STATE.dom.elements.channelsSection = Utils.$('#channels-section');
        STATE.dom.elements.customStreamSection = Utils.$('#custom-stream-panel');
        STATE.dom.elements.bottomNav = Utils.$('#bottom-nav');
        
        console.log('[APP] DOM elements cached');
    },

    /* ==========================================
       UI COMPONENTS INITIALIZATION
       ========================================== */

    initUIComponents: function() {
        console.log('[APP] --- Initializing UI Components ---');

        try {
            HeaderComponent.init();
            console.log('[APP]   Header: OK');
        } catch (e) {
            console.error('[APP]   Header: FAILED -', e.message);
        }

        try {
            SidebarComponent.init();
            console.log('[APP]   Sidebar: OK');
        } catch (e) {
            console.error('[APP]   Sidebar: FAILED -', e.message);
        }

        try {
            TickerComponent.init();
            console.log('[APP]   Ticker: OK');
        } catch (e) {
            console.error('[APP]   Ticker: FAILED -', e.message);
        }

        try {
            MatchesComponent.init();
            console.log('[APP]   Matches: OK');
        } catch (e) {
            console.error('[APP]   Matches: FAILED -', e.message);
        }

        try {
            ChannelsComponent.init();
            console.log('[APP]   Channels: OK');
        } catch (e) {
            console.error('[APP]   Channels: FAILED -', e.message);
        }

        try {
            ModalManager.init();
            console.log('[APP]   Modal: OK');
        } catch (e) {
            console.error('[APP]   Modal: FAILED -', e.message);
        }

        try {
            PlayerModule.init().catch(function(error) {
                console.error('[APP]   Player init async error:', error.message);
            });
            console.log('[APP]   Player: Init started');
        } catch (e) {
            console.error('[APP]   Player: FAILED -', e.message);
        }

        console.log('[APP] --- UI Components Initialized ---');
    },

    /* ==========================================
       DATA LOADING
       ========================================== */

    loadData: async function() {
        console.log('[APP] --- Loading Data ---');
        console.log('[APP] Starting parallel data fetch...');

        try {
            var results = await Promise.allSettled([
                this.loadPlaylist(),
                this.loadFootballMatches(),
                this.loadBreakingNews()
            ]);

            var labels = ['Playlist', 'Football Matches', 'Breaking News'];
            
            results.forEach(function(result, index) {
                if (result.status === 'fulfilled') {
                    console.log('[APP]   ' + labels[index] + ': LOADED');
                } else {
                    console.error('[APP]   ' + labels[index] + ': FAILED -', result.reason ? result.reason.message : 'Unknown');
                }
            });

            console.log('[APP] --- Data Loading Complete ---');
        } catch (error) {
            console.error('[APP] Data loading error:', error.message);
        }
    },

    loadPlaylist: async function() {
        try {
            console.log('[APP] Fetching playlist...');
            await GitHubAPI.init();
            console.log('[APP] Playlist loaded: ' + STATE.playlist.totalCount + ' channels');
            return STATE.playlist.channels;
        } catch (error) {
            console.error('[APP] Playlist load error:', error.message);
            throw error;
        }
    },

    loadFootballMatches: async function() {
        try {
            console.log('[APP] Fetching football matches...');
            await FootballAPI.init();
            console.log('[APP] Matches loaded: ' + STATE.football.matches.length + ' matches, ' + STATE.football.liveMatches.length + ' live');
            return STATE.football.matches;
        } catch (error) {
            console.error('[APP] Football matches load error:', error.message);
            throw error;
        }
    },

    loadBreakingNews: async function() {
        try {
            console.log('[APP] Fetching breaking news...');
            await BreakingNewsAPI.init();
            console.log('[APP] Breaking news loaded: ' + STATE.breakingNews.items.length + ' items');
            return STATE.breakingNews.items;
        } catch (error) {
            console.error('[APP] Breaking news load error:', error.message);
            throw error;
        }
    },

    refreshAllData: async function() {
        console.log('[APP] Refreshing all data...');
        ToastManager.info('Refreshing all data...', 'Syncing');

        try {
            await Promise.allSettled([
                GitHubAPI.fetchPlaylist(true),
                FootballAPI.fetchMatches(true),
                BreakingNewsAPI.fetchBreakingNews(true)
            ]);

            ToastManager.success('All data refreshed', 'Updated');
            console.log('[APP] All data refreshed successfully');
        } catch (error) {
            console.error('[APP] Refresh error:', error.message);
            ToastManager.error('Some data failed to refresh', 'Refresh Error');
        }
    },

    /* ==========================================
       KEYBOARD SHORTCUTS
       ========================================== */

    setupKeyboardShortcuts: function() {
        var self = this;
        
        document.addEventListener('keydown', function(event) {
            var tag = event.target.tagName;
            var isInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
            
            var key = event.key.toLowerCase();
            var ctrl = event.ctrlKey || event.metaKey;
            var shift = event.shiftKey;

            if (ctrl && key === 'r' && !shift) {
                event.preventDefault();
                console.log('[APP] Shortcut: Ctrl+R - Refresh playlist');
                HeaderComponent.refreshPlaylist();
                return;
            }

            if (ctrl && shift && key === 'r') {
                event.preventDefault();
                console.log('[APP] Shortcut: Ctrl+Shift+R - Refresh all');
                self.refreshAllData();
                return;
            }

            if (ctrl && key === 'f') {
                if (!isInput) {
                    event.preventDefault();
                    console.log('[APP] Shortcut: Ctrl+F - Focus search');
                    HeaderComponent.openSearch();
                }
                return;
            }

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
                return;
            }

            if (isInput) return;

            switch (key) {
                case ' ':
                    if (!STATE.ui.searchOpen) {
                        event.preventDefault();
                        PlayerModule.togglePlay();
                    }
                    break;
                case 'f':
                    if (!ctrl) PlayerModule.toggleFullscreen();
                    break;
                case 'm':
                    if (!ctrl) PlayerModule.toggleMute();
                    break;
                case 'p':
                    if (!ctrl) PlayerModule.togglePiP();
                    break;
                case 'l':
                    if (!ctrl) {
                        StateManager.set('football.activeTab', 'live');
                        MatchesComponent.renderMatches();
                        var matchesSection = Utils.$('#matches-section');
                        if (matchesSection) matchesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                    break;
                case '1': case '2': case '3': case '4': case '5':
                case '6': case '7': case '8': case '9':
                    var index = parseInt(key) - 1;
                    var channel = GitHubAPI.getChannelByIndex(index);
                    if (channel) {
                        PlayerModule.playChannel(channel);
                        ToastManager.info('Playing: ' + channel.name, 'Quick Select');
                    }
                    break;
            }
        });

        console.log('[APP] Keyboard shortcuts registered');
    },

    /* ==========================================
       BOTTOM NAVIGATION
       ========================================== */

    setupBottomNavigation: function() {
        var bottomNav = Utils.$('#bottom-nav');
        if (!bottomNav) return;

        var navItems = Utils.$$('.bottom-nav-item', bottomNav);
        var self = this;

        navItems.forEach(function(item) {
            item.addEventListener('click', function() {
                var nav = this.dataset.nav;
                if (!nav) return;

                navItems.forEach(function(ni) { ni.classList.remove('active'); });
                this.classList.add('active');

                self.handleBottomNav(nav);
            });
        });

        console.log('[APP] Bottom navigation ready');
    },

    handleBottomNav: function(nav) {
        StateManager.set('app.activeView', nav);
        console.log('[APP] Bottom nav:', nav);

        switch (nav) {
            case 'home':
                window.scrollTo({ top: 0, behavior: 'smooth' });
                break;

            case 'play-url':
                ModalManager.openPlayUrlModal();
                break;

            case 'live':
                StateManager.set('football.activeTab', 'live');
                MatchesComponent.renderMatches();
                var matchesSection = Utils.$('#matches-section');
                if (matchesSection) matchesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                break;

            case 'scores':
                var scoresSection = Utils.$('#matches-section');
                if (scoresSection) scoresSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                break;

            case 'menu':
                SidebarComponent.toggle();
                break;
        }
    },

    /* ==========================================
       SCROLL TO TOP
       ========================================== */

    setupScrollToTop: function() {
        var scrollBtn = Utils.$('.scroll-to-top');
        
        if (!scrollBtn) {
            scrollBtn = Utils.createElement('button', {
                className: 'scroll-to-top',
                'aria-label': 'Scroll to top',
                title: 'Scroll to top',
                onClick: function() {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            });
            scrollBtn.innerHTML = '<i class="fas fa-chevron-up"></i>';
            document.body.appendChild(scrollBtn);
        }

        var handleScroll = Utils.throttle(function() {
            var scrollY = window.scrollY || window.pageYOffset;
            StateManager.set('ui.scrollPosition', scrollY);

            if (scrollY > 500) {
                scrollBtn.classList.add('visible');
            } else {
                scrollBtn.classList.remove('visible');
            }
        }, CONFIG.UI.SCROLL_THROTTLE);

        window.addEventListener('scroll', handleScroll, { passive: true });
        console.log('[APP] Scroll to top ready');
    },

    /* ==========================================
       PWA INSTALL
       ========================================== */

    setupPWAInstall: function() {
        var self = this;

        window.addEventListener('beforeinstallprompt', function(event) {
            event.preventDefault();
            STATE.pwa.installPromptEvent = event;
            STATE.pwa.installable = true;
            console.log('[APP] PWA install prompt available');

            if (!STATE.pwa.installBannerDismissed) {
                setTimeout(function() {
                    self.showInstallBanner();
                }, CONFIG.PWA.INSTALL_PROMPT_DELAY);
            }
        });

        window.addEventListener('appinstalled', function() {
            STATE.pwa.installed = true;
            STATE.pwa.installPromptEvent = null;
            console.log('[APP] PWA installed successfully');
            ToastManager.success('App installed successfully!', 'Installed');
            self.hideInstallBanner();
        });

        console.log('[APP] PWA install handlers ready');
    },

    showInstallBanner: function() {
        if (!STATE.pwa.installable || STATE.pwa.installed) return;
        if (Utils.$('.install-banner')) return;

        var banner = Utils.createElement('div', { className: 'install-banner' });
        banner.innerHTML = '<img src="assets/favicon.png" alt="XBZ Prime TV" class="install-banner-icon" width="40" height="40">' +
            '<div class="install-banner-text">' +
            '<div class="install-banner-title">Install XBZ Prime TV</div>' +
            '<div class="install-banner-subtitle">Add to home screen for quick access</div>' +
            '</div>' +
            '<button class="btn btn-sm btn-primary install-btn">Install</button>' +
            '<button class="install-banner-close" aria-label="Dismiss"><i class="fas fa-times"></i></button>';

        document.body.appendChild(banner);

        var self = this;
        var installBtn = Utils.$('.install-btn', banner);
        if (installBtn) {
            installBtn.addEventListener('click', async function() {
                if (STATE.pwa.installPromptEvent) {
                    await STATE.pwa.installPromptEvent.prompt();
                    var result = await STATE.pwa.installPromptEvent.userChoice;
                    console.log('[APP] PWA install choice:', result.outcome);
                    STATE.pwa.installPromptEvent = null;
                }
                self.hideInstallBanner();
            });
        }

        var closeBtn = Utils.$('.install-banner-close', banner);
        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                self.hideInstallBanner();
                STATE.pwa.installBannerDismissed = true;
                Utils.setToStorage(CONFIG.STORAGE_KEYS.INSTALL_PROMPT_SHOWN, true);
            });
        }
    },

    hideInstallBanner: function() {
        var banner = Utils.$('.install-banner');
        if (banner) {
            banner.classList.add('removing');
            setTimeout(function() { banner.remove(); }, 300);
        }
    },

    /* ==========================================
       INTERSECTION OBSERVERS
       ========================================== */

    setupIntersectionObservers: function() {
        ChannelsComponent.setupIntersectionObserver();
        MatchesComponent.setupIntersectionObserver();
        this.observeRevealElements();

        var self = this;
        var observer = new MutationObserver(Utils.debounce(function() {
            self.observeRevealElements();
        }, 200));

        var grid = Utils.$('#channels-grid');
        if (grid) observer.observe(grid, { childList: true, subtree: false });

        var matchGrid = Utils.$('#matches-grid');
        if (matchGrid) observer.observe(matchGrid, { childList: true, subtree: false });

        console.log('[APP] Intersection observers ready');
    },

    observeRevealElements: function() {
        ChannelsComponent.observeChannelCards();
        var matchCards = Utils.$$('.match-card.reveal:not(.visible)');
        if (STATE.dom.observers.matchReveal) {
            matchCards.forEach(function(card) {
                STATE.dom.observers.matchReveal.observe(card);
            });
        }
    },

    /* ==========================================
       CUSTOM STREAM PANEL
       ========================================== */

    setupCustomStreamPanel: function() {
        var toggle = Utils.$('#custom-stream-toggle');
        var content = Utils.$('#custom-stream-content');
        
        if (!toggle || !content) return;

        toggle.addEventListener('click', function() {
            var isOpen = !content.classList.contains('hidden');
            if (isOpen) {
                content.classList.add('hidden');
                var chevron = toggle.querySelector('.chevron-icon');
                if (chevron) chevron.classList.remove('open');
                StateManager.set('ui.customStreamOpen', false);
            } else {
                content.classList.remove('hidden');
                var chevron2 = toggle.querySelector('.chevron-icon');
                if (chevron2) chevron2.classList.add('open');
                StateManager.set('ui.customStreamOpen', true);
            }
        });

        var streamTabs = Utils.$$('.stream-tab');
        streamTabs.forEach(function(tab) {
            tab.addEventListener('click', function() {
                var tabName = this.dataset.streamTab;
                streamTabs.forEach(function(t) { t.classList.remove('active'); });
                this.classList.add('active');
                
                var tabContents = Utils.$$('.stream-tab-content');
                tabContents.forEach(function(tc) { tc.classList.add('hidden'); });
                
                var targetContent = Utils.$('#stream-tab-' + tabName);
                if (targetContent) targetContent.classList.remove('hidden');
                
                StateManager.set('ui.customStreamTab', tabName);
            });
        });

        // Direct URL
        var directPlayBtn = Utils.$('#direct-url-play');
        var directUrlInput = Utils.$('#direct-url-input');
        
        if (directPlayBtn && directUrlInput) {
            directPlayBtn.addEventListener('click', function() {
                var url = directUrlInput.value.trim();
                if (url && Utils.isValidURL(url)) {
                    PlayerModule.playDirectUrl(url);
                } else {
                    ToastManager.error('Please enter a valid stream URL', 'Invalid URL');
                }
            });
            directUrlInput.addEventListener('keydown', function(event) {
                if (event.key === 'Enter') directPlayBtn.click();
            });
        }

        // M3U
        var m3uLoadBtn = Utils.$('#m3u-load');
        var m3uInput = Utils.$('#m3u-input');
        
        if (m3uLoadBtn && m3uInput) {
            m3uLoadBtn.addEventListener('click', async function() {
                var m3uContent = m3uInput.value.trim();
                if (!m3uContent) {
                    ToastManager.warning('Please paste M3U content or URL', 'Empty Input');
                    return;
                }
                try {
                    var m3uText = m3uContent;
                    if (Utils.isValidURL(m3uContent)) {
                        ToastManager.info('Fetching M3U playlist...', 'Loading');
                        m3uText = await Utils.fetchText(m3uContent);
                    }
                    var channels = Utils.parseM3U(m3uText);
                    if (channels.length === 0) {
                        ToastManager.error('No channels found in playlist', 'Parse Error');
                        return;
                    }
                    var allChannels = STATE.playlist.channels.concat(channels);
                    var unique = Utils.removeDuplicateChannels(allChannels);
                    StateManager.set('playlist.channels', unique);
                    StateManager.set('playlist.categories', Utils.extractCategories(unique));
                    ToastManager.success(channels.length + ' channels loaded from M3U', 'M3U Loaded');
                    m3uInput.value = '';
                } catch (error) {
                    console.error('[APP] M3U load error:', error);
                    ToastManager.error('Failed to load M3U playlist', 'Error');
                }
            });
        }

        // Embed
        var embedRenderBtn = Utils.$('#embed-render');
        var embedInput = Utils.$('#embed-input');
        var embedPreview = Utils.$('#embed-preview');
        
        if (embedRenderBtn && embedInput) {
            embedRenderBtn.addEventListener('click', function() {
                var code = embedInput.value.trim();
                if (!code) {
                    ToastManager.warning('Please paste HTML embed code', 'Empty Input');
                    return;
                }
                if (!Utils.isEmbedCode(code)) {
                    ToastManager.error('No iframe found in embed code', 'Invalid Embed');
                    return;
                }
                PlayerModule.playEmbed(code);
                if (embedPreview) {
                    embedPreview.classList.remove('hidden');
                    embedPreview.innerHTML = code;
                }
                var playerSection = Utils.$('#player-section');
                if (playerSection) playerSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                ToastManager.success('Embed rendered', 'Success');
            });
        }

        // Player overlay buttons
        this.setupPlayerOverlayButtons();
        console.log('[APP] Custom stream panel ready');
    },

    setupPlayerOverlayButtons: function() {
        var playerRetry = Utils.$('#player-retry');
        if (playerRetry) {
            playerRetry.addEventListener('click', function() {
                PlayerModule.showLoading();
                PlayerModule.hideError();
                var source = STATE.player.availableSources[STATE.player.currentSourceIndex];
                if (source) {
                    PlayerModule.playStream(source).catch(function() {
                        PlayerModule.handlePlaybackError(new Error('Retry failed'));
                    });
                }
            });
        }

        var playerNextSource = Utils.$('#player-next-source');
        if (playerNextSource) {
            playerNextSource.addEventListener('click', function() {
                PlayerModule.tryNextSource();
            });
        }

        var playerStop = Utils.$('#player-stop');
        if (playerStop) {
            playerStop.addEventListener('click', function() {
                PlayerModule.stop();
            });
        }

        var playerCancel = Utils.$('#player-cancel');
        if (playerCancel) {
            playerCancel.addEventListener('click', function() {
                PlayerModule.stop();
                ToastManager.info('Playback cancelled', 'Stopped');
            });
        }
    },

    /* ==========================================
       CLEANUP
       ========================================== */

    destroy: function() {
        console.log('[APP] Cleaning up...');

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

        StateManager.clearAllTimers();
        StateManager.abortAllFetches();
        StateManager.persistState();

        console.log('[APP] Cleanup complete');
    }
};

/* ==========================================
   APP STARTUP
   ========================================== */

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        XBZPrimeTV.init();
    });
} else {
    XBZPrimeTV.init();
}

window.addEventListener('beforeunload', function() {
    XBZPrimeTV.destroy();
});

document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        console.log('[APP] Page hidden');
    } else {
        console.log('[APP] Page visible');
        StateManager.set('app.lastActivity', Date.now());
    }
});

if (typeof module !== 'undefined' && module.exports) {
    module.exports = XBZPrimeTV;
}
