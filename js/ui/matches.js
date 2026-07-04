/*=============================================
  ⚽ XBZ Prime TV - Matches Component
  Football Match Cards, Tabs & Watch Integration
  =============================================*/

'use strict';

const MatchesComponent = {
    /* ==========================================
       DOM ELEMENTS
       ========================================== */

    elements: {
        section: null,
        grid: null,
        emptyState: null,
        tabs: null,
        refreshBtn: null,
    },

    /* ==========================================
       INITIALIZATION
       ========================================== */

    /**
     * Initialize matches component
     */
    init() {
        console.log('[MATCHES] Initializing matches component...');

        try {
            // Cache DOM elements
            this.cacheElements();

            // Set up event listeners
            this.setupEventListeners();

            // Set up tab switching
            this.setupTabs();

            // Initial render
            this.renderMatches();

            console.log('[MATCHES] Matches component initialized');
        } catch (error) {
            console.error('[MATCHES] Initialization error:', error);
        }
    },

    /**
     * Cache matches DOM elements
     */
    cacheElements() {
        this.elements.section = Utils.$('#matches-section');
        this.elements.grid = Utils.$('#matches-grid');
        this.elements.emptyState = Utils.$('#matches-empty');
        this.elements.refreshBtn = Utils.$('#matches-refresh');
        
        // Cache tabs
        this.elements.tabs = Utils.$$('.match-tab');
    },

    /* ==========================================
       EVENT LISTENERS
       ========================================== */

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Refresh button
        if (this.elements.refreshBtn) {
            this.elements.refreshBtn.addEventListener('click', () => {
                this.refreshMatches();
            });
        }

        // Listen for match data updates
        document.body.addEventListener('football:loaded', () => {
            this.renderMatches();
        });

        // Listen for tab state changes
        document.body.addEventListener('statechange', (event) => {
            if (event.detail?.path === 'football.activeTab') {
                this.renderMatches();
                this.updateActiveTab(event.detail.newValue);
            }
        });

        // Delegate click events in match grid
        if (this.elements.grid) {
            this.elements.grid.addEventListener('click', (event) => {
                const watchBtn = event.target.closest('.match-watch-btn');
                if (watchBtn) {
                    const matchId = watchBtn.dataset.matchId;
                    if (matchId) {
                        this.handleWatchMatch(matchId);
                    }
                }
            });
        }
    },

    /**
     * Set up tab switching
     */
    setupTabs() {
        if (!this.elements.tabs || this.elements.tabs.length === 0) return;

        this.elements.tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab;
                if (tabName) {
                    StateManager.set('football.activeTab', tabName);
                }
            });
        });
    },

    /**
     * Update active tab UI
     * @param {string} activeTab - Active tab name
     */
    updateActiveTab(activeTab) {
        if (!this.elements.tabs) return;

        this.elements.tabs.forEach(tab => {
            if (tab.dataset.tab === activeTab) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });
    },

    /* ==========================================
       MATCH RENDERING
       ========================================== */

    /**
     * Render matches based on active tab
     */
    renderMatches() {
        if (!this.elements.grid) return;

        try {
            const activeTab = STATE.football.activeTab;
            let matches = [];

            switch (activeTab) {
                case 'live':
                    matches = STATE.football.liveMatches;
                    break;
                case 'upcoming':
                    matches = STATE.football.upcomingMatches;
                    break;
                case 'finished':
                    matches = STATE.football.finishedMatches;
                    break;
                default:
                    matches = STATE.football.liveMatches;
            }

            // Clear grid
            Utils.emptyElement(this.elements.grid);

            if (matches.length === 0) {
                this.showEmptyState(activeTab);
                return;
            }

            // Hide empty state
            this.hideEmptyState();

            // Render match cards
            matches.forEach((match, index) => {
                const card = this.createMatchCard(match, index);
                this.elements.grid.appendChild(card);
            });

            console.log(`[MATCHES] Rendered ${matches.length} ${activeTab} matches`);
        } catch (error) {
            console.error('[MATCHES] Error rendering matches:', error);
        }
    },

    /**
     * Create a match card element
     * @param {Object} match - Match data
     * @param {number} index - Match index
     * @returns {Element} Match card element
     */
    createMatchCard(match, index) {
        const isLive = match.isLive || match.status === 'LIVE' || match.status === 'IN_PLAY';
        const isFinished = match.status === 'FINISHED';
        const isUpcoming = match.status === 'SCHEDULED' || match.status === 'TIMED';

        const card = Utils.createElement('div', {
            className: `match-card ${isLive ? 'live-match' : ''} reveal`,
            dataset: { matchId: match.id },
        });

        // Add stagger delay
        card.style.animationDelay = `${index * 50}ms`;

        // Card Header - League & Status
        const header = Utils.createElement('div', {
            className: 'match-card-header',
        });

        const league = Utils.createElement('span', {
            className: 'match-league',
        });
        league.innerHTML = `
            <span class="league-emoji">${match.leagueEmoji || '⚽'}</span>
            ${Utils.escapeHTML(Utils.truncate(match.competition?.name || 'Unknown', 25))}
        `;

        const status = Utils.createElement('span', {
            className: `match-status ${isLive ? 'live' : isUpcoming ? 'upcoming' : 'finished'}`,
        });

        if (isLive) {
            status.innerHTML = `<span class="live-dot"></span> ${match.minute ? match.minute + "'" : 'LIVE'}`;
        } else if (isUpcoming) {
            status.textContent = Utils.formatMatchTime(match.utcDate);
        } else {
            status.textContent = 'FT';
        }

        header.appendChild(league);
        header.appendChild(status);

        // Teams Section
        const teams = Utils.createElement('div', {
            className: 'match-teams',
        });

        // Home Team
        const homeTeam = Utils.createElement('div', {
            className: 'match-team home',
        });

        if (match.homeTeam?.crest) {
            const homeLogo = Utils.createElement('img', {
                src: match.homeTeam.crest,
                alt: match.homeTeam.name || 'Home',
                className: 'match-team-logo',
                loading: 'lazy',
                onerror: function() {
                    this.style.display = 'none';
                    this.nextElementSibling.style.display = 'flex';
                },
            });
            homeTeam.appendChild(homeLogo);
            
            const homeLogoFallback = Utils.createElement('div', {
                className: 'match-team-logo-fallback',
                style: { display: 'none' },
                text: (match.homeTeam.shortName || 'H').substring(0, 3).toUpperCase(),
            });
            homeTeam.appendChild(homeLogoFallback);
        } else {
            const homeLogoFallback = Utils.createElement('div', {
                className: 'match-team-logo-fallback',
                text: (match.homeTeam?.shortName || 'H').substring(0, 3).toUpperCase(),
            });
            homeTeam.appendChild(homeLogoFallback);
        }

        const homeName = Utils.createElement('span', {
            className: 'match-team-name',
            text: match.homeTeam?.shortName || match.homeTeam?.name || 'Home',
        });
        homeTeam.appendChild(homeName);

        // Score
        const score = Utils.createElement('div', {
            className: 'match-score',
        });

        if (isUpcoming) {
            const vsText = Utils.createElement('span', {
                className: 'match-score-full',
                text: 'vs',
                style: { fontSize: 'var(--text-xl)', color: 'var(--color-text-muted)' },
            });
            score.appendChild(vsText);
        } else {
            const scoreText = Utils.createElement('span', {
                className: 'match-score-full',
                text: match.displayScore || 
                    `${match.score?.fullTime?.home ?? 0} - ${match.score?.fullTime?.away ?? 0}`,
            });
            score.appendChild(scoreText);

            if (isLive) {
                const minute = Utils.createElement('span', {
                    className: 'match-minute',
                    text: match.minute ? match.minute + "'" : 'LIVE',
                });
                score.appendChild(minute);
            }
        }

        // Away Team
        const awayTeam = Utils.createElement('div', {
            className: 'match-team away',
        });

        if (match.awayTeam?.crest) {
            const awayLogo = Utils.createElement('img', {
                src: match.awayTeam.crest,
                alt: match.awayTeam.name || 'Away',
                className: 'match-team-logo',
                loading: 'lazy',
                onerror: function() {
                    this.style.display = 'none';
                    this.nextElementSibling.style.display = 'flex';
                },
            });
            awayTeam.appendChild(awayLogo);
            
            const awayLogoFallback = Utils.createElement('div', {
                className: 'match-team-logo-fallback',
                style: { display: 'none' },
                text: (match.awayTeam.shortName || 'A').substring(0, 3).toUpperCase(),
            });
            awayTeam.appendChild(awayLogoFallback);
        } else {
            const awayLogoFallback = Utils.createElement('div', {
                className: 'match-team-logo-fallback',
                text: (match.awayTeam?.shortName || 'A').substring(0, 3).toUpperCase(),
            });
            awayTeam.appendChild(awayLogoFallback);
        }

        const awayName = Utils.createElement('span', {
            className: 'match-team-name',
            text: match.awayTeam?.shortName || match.awayTeam?.name || 'Away',
        });
        awayTeam.appendChild(awayName);

        teams.appendChild(homeTeam);
        teams.appendChild(score);
        teams.appendChild(awayTeam);

        // Card Footer
        const footer = Utils.createElement('div', {
            className: 'match-card-footer',
        });

        const date = Utils.createElement('span', {
            className: 'match-date',
        });
        date.innerHTML = `<i class="far fa-calendar-alt"></i> ${Utils.formatMatchDate(match.utcDate)}`;

        const watchBtn = Utils.createElement('button', {
            className: 'match-watch-btn',
            dataset: { matchId: match.id },
            title: 'Find channel for this match',
        });
        watchBtn.innerHTML = '<i class="fas fa-play"></i> Watch';

        footer.appendChild(date);
        footer.appendChild(watchBtn);

        // Assemble card
        card.appendChild(header);
        card.appendChild(teams);
        card.appendChild(footer);

        return card;
    },

    /* ==========================================
       WATCH MATCH HANDLER
       ========================================== */

    /**
     * Handle watch match button click
     * @param {string|number} matchId - Match ID
     */
    handleWatchMatch(matchId) {
        try {
            // Find the match
            const match = FootballAPI.getMatchById(parseInt(matchId));
            if (!match) {
                ToastManager.error('Match not found', 'Error');
                return;
            }

            console.log(`[MATCHES] Watch match: ${match.homeTeam?.name} vs ${match.awayTeam?.name}`);

            // Find best matching channel
            const channel = FootballAPI.findChannelForMatch(match);

            if (channel) {
                // Play the channel
                PlayerModule.playChannel(channel);
                
                // Scroll to player
                const playerSection = Utils.$('#player-section');
                if (playerSection) {
                    playerSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }

                ToastManager.success(
                    `Playing ${channel.name} for ${match.homeTeam?.shortName} vs ${match.awayTeam?.shortName}`,
                    'Match Found'
                );
            } else {
                // No matching channel found
                ToastManager.warning(
                    'No sports channel found for this match. Try selecting a channel manually.',
                    'No Channel Match'
                );

                // Scroll to channels section
                const channelsSection = Utils.$('#channels-section');
                if (channelsSection) {
                    channelsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
        } catch (error) {
            console.error('[MATCHES] Error handling watch match:', error);
            ToastManager.error('Failed to find channel for this match', 'Error');
        }
    },

    /* ==========================================
       EMPTY STATE
       ========================================== */

    /**
     * Show empty state for current tab
     * @param {string} tab - Active tab name
     */
    showEmptyState(tab) {
        if (!this.elements.emptyState) return;

        this.elements.emptyState.classList.remove('hidden');

        const icon = Utils.$('i', this.elements.emptyState);
        const message = Utils.$('p', this.elements.emptyState);

        if (icon) {
            switch (tab) {
                case 'live':
                    icon.className = 'fas fa-broadcast-tower';
                    break;
                case 'upcoming':
                    icon.className = 'fas fa-clock';
                    break;
                case 'finished':
                    icon.className = 'fas fa-check-circle';
                    break;
            }
        }

        if (message) {
            switch (tab) {
                case 'live':
                    message.textContent = 'No live matches at the moment';
                    break;
                case 'upcoming':
                    message.textContent = 'No upcoming matches scheduled';
                    break;
                case 'finished':
                    message.textContent = 'No finished matches today';
                    break;
            }
        }
    },

    /**
     * Hide empty state
     */
    hideEmptyState() {
        if (this.elements.emptyState) {
            this.elements.emptyState.classList.add('hidden');
        }
    },

    /* ==========================================
       REFRESH
       ========================================== */

    /**
     * Refresh matches data
     */
    async refreshMatches() {
        try {
            console.log('[MATCHES] Manual match refresh triggered');

            // Show loading on refresh button
            if (this.elements.refreshBtn) {
                const icon = Utils.$('i', this.elements.refreshBtn);
                if (icon) {
                    icon.classList.add('fa-spin');
                }
                this.elements.refreshBtn.disabled = true;
            }

            // Fetch fresh matches
            await FootballAPI.fetchMatches(true);

            // Render updated matches
            this.renderMatches();

            // Reset refresh button
            if (this.elements.refreshBtn) {
                const icon = Utils.$('i', this.elements.refreshBtn);
                if (icon) {
                    icon.classList.remove('fa-spin');
                }
                this.elements.refreshBtn.disabled = false;
            }

            const liveCount = STATE.football.liveMatches.length;
            ToastManager.success(
                `Matches refreshed. ${liveCount} live now.`,
                'Updated'
            );

        } catch (error) {
            console.error('[MATCHES] Refresh error:', error);
            
            // Reset refresh button
            if (this.elements.refreshBtn) {
                const icon = Utils.$('i', this.elements.refreshBtn);
                if (icon) {
                    icon.classList.remove('fa-spin');
                }
                this.elements.refreshBtn.disabled = false;
            }

            ToastManager.error('Failed to refresh matches', 'Error');
        }
    },

    /* ==========================================
       INTERSECTION OBSERVER
       ========================================== */

    /**
     * Set up intersection observer for reveal animations
     */
    setupIntersectionObserver() {
        try {
            const observer = new IntersectionObserver(
                (entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            entry.target.classList.add('visible');
                            observer.unobserve(entry.target);
                        }
                    });
                },
                { threshold: CONFIG.UI.INTERSECTION_THRESHOLD }
            );

            // Observe all reveal elements
            const revealElements = Utils.$$('.reveal');
            revealElements.forEach(el => observer.observe(el));

            // Store observer
            STATE.dom.observers.matchReveal = observer;
        } catch (error) {
            console.error('[MATCHES] Error setting up intersection observer:', error);
        }
    },

    /* ==========================================
       MATCH STATS DISPLAY
       ========================================== */

    /**
     * Get formatted match statistics
     * @returns {Object} Match statistics
     */
    getStats() {
        return {
            total: STATE.football.matches.length,
            live: STATE.football.liveMatches.length,
            upcoming: STATE.football.upcomingMatches.length,
            finished: STATE.football.finishedMatches.length,
            lastUpdated: STATE.football.lastUpdated,
        };
    },

    /* ==========================================
       CLEANUP
       ========================================== */

    /**
     * Clean up matches component
     */
    destroy() {
        // Disconnect observers
        if (STATE.dom.observers.matchReveal) {
            STATE.dom.observers.matchReveal.disconnect();
        }

        console.log('[MATCHES] Matches component destroyed');
    },
};

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MatchesComponent;
}
