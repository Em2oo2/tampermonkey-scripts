// ==UserScript==
// @name         TMDB Streaming Links with Enhanced UI
// @namespace    http://tampermonkey.net/
// @version      1.9
// @description  Display streaming links on TMDB pages with responsive design and improved user experience
// @author       Your Name
// @match        https://www.themoviedb.org/movie/*
// @match        https://www.themoviedb.org/tv/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const sourceUrls = {
        embed: 'https://embed.su/embed',
        vidlink: 'https://vidlink.pro',
        vidsrcnet: 'https://vidsrc.net/embed',
        moviesapiclub: 'https://moviesapi.club',
        superembed: 'https://multiembed.mov/directstream.php?video_id=',
        frembed: 'https://frembed.live/api',
        videasy: 'https://player.videasy.net'
    };

    // Media query breakpoints
    const MOBILE_BREAKPOINT = 768;

    const styles = {
        container: `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: linear-gradient(145deg, rgba(20, 20, 20, 0.95), rgba(30, 30, 30, 0.95));
            padding: 15px;
            border-radius: 12px;
            z-index: 1000;
            color: #fff;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            width: auto;
            max-width: 90vw;
            transform: translateY(0);
            transition: all 0.3s ease;
        `,
        mobileContainer: `
            bottom: 10px;
            right: 10px;
            padding: 12px;
            max-width: 95vw;
            font-size: 14px;
        `,
        title: `
            margin: 0 0 15px 0;
            font-size: 18px;
            font-weight: 600;
            color: #fff;
            border-bottom: 2px solid rgba(255, 255, 255, 0.1);
            padding-bottom: 8px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        `,
        mobileTitleText: `
            font-size: 16px;
        `,
        inputContainer: `
            display: flex;
            gap: 10px;
            margin-bottom: 15px;
            flex-wrap: wrap;
        `,
        inputGroup: `
            display: flex;
            align-items: center;
            gap: 8px;
        `,
        label: `
            font-size: 14px;
            color: rgba(255, 255, 255, 0.7);
            white-space: nowrap;
        `,
        mobileLabel: `
            font-size: 12px;
        `,
        input: `
            width: 60px;
            padding: 6px;
            border-radius: 6px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            background: rgba(255, 255, 255, 0.1);
            color: #fff;
            font-size: 14px;
            transition: all 0.2s ease;
            &:focus {
                outline: none;
                border-color: rgba(255, 255, 255, 0.5);
                background: rgba(255, 255, 255, 0.15);
            }
        `,
        mobileInput: `
            width: 50px;
            padding: 4px;
            font-size: 12px;
        `,
        linkContainer: `
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 8px;
            margin-bottom: 6px;
            border-radius: 6px;
            background: rgba(255, 255, 255, 0.05);
            transition: background 0.2s ease;
            gap: 8px;
            &:hover {
                background: rgba(255, 255, 255, 0.1);
            }
        `,
        mobileLinkContainer: `
            padding: 6px;
            margin-bottom: 4px;
        `,
        link: `
            color: #fff;
            text-decoration: none;
            font-size: 14px;
            font-weight: 500;
            flex-grow: 1;
            transition: color 0.2s ease;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            &:hover {
                color: #3498db;
            }
        `,
        mobileLink: `
            font-size: 12px;
        `,
        copyButton: `
            background: rgba(255, 255, 255, 0.1);
            border: none;
            color: #fff;
            cursor: pointer;
            font-size: 14px;
            padding: 4px 8px;
            border-radius: 4px;
            transition: all 0.2s ease;
            flex-shrink: 0;
            &:hover {
                background: rgba(255, 255, 255, 0.2);
            }
            &:active {
                transform: scale(0.95);
            }
        `,
        mobileCopyButton: `
            font-size: 12px;
            padding: 3px 6px;
        `,
        toggleButton: `
            background: none;
            border: none;
            color: rgba(255, 255, 255, 0.7);
            cursor: pointer;
            padding: 0;
            font-size: 18px;
            transition: color 0.2s ease;
            &:hover {
                color: #fff;
            }
        `,
        mobileToggleButton: `
            font-size: 16px;
        `
    };

    let state = {
        mediaId: null,
        mediaType: null,
        season: 1,
        episode: 1,
        isMinimized: false,
        isMobile: window.innerWidth <= MOBILE_BREAKPOINT
    };

    function applyStyles(element, styleString, mobileStyleString = '') {
        const baseStyles = styleString.split(';').filter(style => style.trim());
        const mobileStyles = mobileStyleString.split(';').filter(style => style.trim());

        const applyStylePairs = (pairs) => {
            pairs.forEach(style => {
                const [property, value] = style.split(':').map(s => s.trim());
                if (property && value) {
                    element.style[property.replace(/-([a-z])/g, g => g[1].toUpperCase())] = value;
                }
            });
        };

        applyStylePairs(baseStyles);
        if (state.isMobile && mobileStyleString) {
            applyStylePairs(mobileStyles);
        }
    }

    function getMediaInfo() {
        const path = window.location.pathname;
        const match = path.match(/\/(movie|tv)\/(\d+)/);
        if (match) {
            state.mediaId = match[2];
            state.mediaType = match[1];
        }
    }

    function createInputFields() {
        const container = document.createElement('div');
        applyStyles(container, styles.container, styles.mobileContainer);

        const titleBar = document.createElement('div');
        applyStyles(titleBar, styles.title);

        const titleText = document.createElement('span');
        titleText.textContent = '🎬 Streaming Links';
        applyStyles(titleText, '', styles.mobileTitleText);
        titleBar.appendChild(titleText);

        const toggleButton = document.createElement('button');
        toggleButton.textContent = '−';
        applyStyles(toggleButton, styles.toggleButton, styles.mobileToggleButton);
        titleBar.appendChild(toggleButton);

        container.appendChild(titleBar);

        const contentContainer = document.createElement('div');
        contentContainer.id = 'streamingContent';

        if (state.mediaType === 'tv') {
            const inputContainer = document.createElement('div');
            applyStyles(inputContainer, styles.inputContainer);

            ['season', 'episode'].forEach(type => {
                const group = document.createElement('div');
                applyStyles(group, styles.inputGroup);

                const label = document.createElement('label');
                label.textContent = type.charAt(0).toUpperCase() + type.slice(1);
                applyStyles(label, styles.label, styles.mobileLabel);
                group.appendChild(label);

                const input = document.createElement('input');
                input.type = 'number';
                input.id = `${type}Input`;
                input.value = state[type];
                input.min = 1;
                applyStyles(input, styles.input, styles.mobileInput);

                input.addEventListener('change', () => {
                    state[type] = parseInt(input.value, 10);
                    updateStreamingLinks();
                });

                group.appendChild(input);
                inputContainer.appendChild(group);
            });

            contentContainer.appendChild(inputContainer);
        }

        const linksContainer = document.createElement('div');
        linksContainer.id = 'streamingLinks';
        contentContainer.appendChild(linksContainer);

        container.appendChild(contentContainer);
        document.body.appendChild(container);

        // Toggle functionality
        toggleButton.addEventListener('click', () => {
            state.isMinimized = !state.isMinimized;
            contentContainer.style.display = state.isMinimized ? 'none' : 'block';
            toggleButton.textContent = state.isMinimized ? '+' : '−';
            container.style.transform = state.isMinimized ? 'translateY(0)' : 'translateY(0)';
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            state.isMobile = window.innerWidth <= MOBILE_BREAKPOINT;
            container.className = state.isMobile ? 'mobile' : '';
            updateStreamingLinks(); // Refresh links with new styles
        });
    }

    function updateStreamingLinks() {
        const linksContainer = document.getElementById('streamingLinks');
        linksContainer.innerHTML = '';

        Object.entries(sourceUrls).forEach(([source, url]) => {
            const linkContainer = document.createElement('div');
            applyStyles(linkContainer, styles.linkContainer, styles.mobileLinkContainer);

            const link = document.createElement('a');
            link.href = buildUrl(url, state.mediaId, state.mediaType, state.season, state.episode);
            link.textContent = source === 'frembed' ? `${source} 🇫🇷` : source;
            applyStyles(link, styles.link, styles.mobileLink);
            link.target = '_blank';
            linkContainer.appendChild(link);

            const copyButton = document.createElement('button');
            copyButton.textContent = '📋';
            applyStyles(copyButton, styles.copyButton, styles.mobileCopyButton);

            copyButton.addEventListener('click', () => {
                navigator.clipboard.writeText(link.href).then(() => {
                    copyButton.textContent = '✅';
                    setTimeout(() => {
                        copyButton.textContent = '📋';
                    }, 1000);
                }).catch(() => {
                    copyButton.textContent = '❌';
                    setTimeout(() => {
                        copyButton.textContent = '📋';
                    }, 1000);
                });
            });
            linkContainer.appendChild(copyButton);

            linksContainer.appendChild(linkContainer);
        });
    }

    function buildUrl(baseUrl, mediaId, mediaType, season = 1, episode = 1) {
        if (baseUrl.includes('frembed')) {
            if (mediaType === 'tv') {
                return `${baseUrl}/serie.php?id=${mediaId}&sa=${season}&epi=${episode}`;
            } else {
                return `${baseUrl}/film.php?id=${mediaId}`;
            }
        } else if (baseUrl.includes('videasy')) {
            return mediaType === 'tv'
                ? `${baseUrl}/tv/${mediaId}/${season}/${episode}`
                : `${baseUrl}/movie/${mediaId}`;
        }
        return mediaType === 'tv'
            ? `${baseUrl}/tv/${mediaId}/${season}/${episode}`
            : `${baseUrl}/movie/${mediaId}`;
    }

    function init() {
        getMediaInfo();
        createInputFields();
        updateStreamingLinks();
    }

    init();
})();
