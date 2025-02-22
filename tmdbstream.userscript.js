// ==UserScript==
// @name         TMDB Streaming Links with Enhanced UI
// @namespace    http://tampermonkey.net/
// @version      1.8
// @description  Display streaming links on TMDB pages with modern UI, animations, and improved user experience
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

    const styles = {
        container: `
            position: fixed;
            bottom: 30px;
            right: 30px;
            background: linear-gradient(145deg, rgba(20, 20, 20, 0.95), rgba(30, 30, 30, 0.95));
            padding: 20px;
            border-radius: 15px;
            z-index: 1000;
            color: #fff;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            min-width: 280px;
            transform: translateY(0);
            transition: transform 0.3s ease, opacity 0.3s ease;
        `,
        title: `
            margin: 0 0 20px 0;
            font-size: 20px;
            font-weight: 600;
            color: #fff;
            border-bottom: 2px solid rgba(255, 255, 255, 0.1);
            padding-bottom: 10px;
        `,
        inputContainer: `
            display: flex;
            gap: 15px;
            margin-bottom: 20px;
        `,
        inputGroup: `
            display: flex;
            flex-direction: column;
            gap: 5px;
        `,
        label: `
            font-size: 14px;
            color: rgba(255, 255, 255, 0.7);
        `,
        input: `
            width: 70px;
            padding: 8px;
            border-radius: 8px;
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
            &::-webkit-inner-spin-button {
                opacity: 1;
            }
        `,
        linkContainer: `
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 10px;
            margin-bottom: 8px;
            border-radius: 8px;
            background: rgba(255, 255, 255, 0.05);
            transition: background 0.2s ease;
            &:hover {
                background: rgba(255, 255, 255, 0.1);
            }
        `,
        link: `
            color: #fff;
            text-decoration: none;
            font-size: 15px;
            font-weight: 500;
            flex-grow: 1;
            transition: color 0.2s ease;
            &:hover {
                color: #3498db;
            }
        `,
        copyButton: `
            background: rgba(255, 255, 255, 0.1);
            border: none;
            color: #fff;
            cursor: pointer;
            font-size: 14px;
            padding: 6px 12px;
            border-radius: 6px;
            transition: all 0.2s ease;
            &:hover {
                background: rgba(255, 255, 255, 0.2);
            }
            &:active {
                transform: scale(0.95);
            }
        `
    };

    let state = {
        mediaId: null,
        mediaType: null,
        season: 1,
        episode: 1
    };

    function applyStyles(element, styleString) {
        const styles = styleString.split(';').filter(style => style.trim());
        styles.forEach(style => {
            const [property, value] = style.split(':').map(s => s.trim());
            if (property && value) {
                element.style[property.replace(/-([a-z])/g, g => g[1].toUpperCase())] = value;
            }
        });
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
        applyStyles(container, styles.container);

        const title = document.createElement('h3');
        title.textContent = '🎬 Streaming Links';
        applyStyles(title, styles.title);
        container.appendChild(title);

        if (state.mediaType === 'tv') {
            const inputContainer = document.createElement('div');
            applyStyles(inputContainer, styles.inputContainer);

            ['season', 'episode'].forEach(type => {
                const group = document.createElement('div');
                applyStyles(group, styles.inputGroup);

                const label = document.createElement('label');
                label.textContent = type.charAt(0).toUpperCase() + type.slice(1);
                applyStyles(label, styles.label);
                group.appendChild(label);

                const input = document.createElement('input');
                input.type = 'number';
                input.id = `${type}Input`;
                input.value = state[type];
                input.min = 1;
                applyStyles(input, styles.input);

                input.addEventListener('change', () => {
                    state[type] = parseInt(input.value, 10);
                    updateStreamingLinks();
                });

                group.appendChild(input);
                inputContainer.appendChild(group);
            });

            container.appendChild(inputContainer);
        }

        const linksContainer = document.createElement('div');
        linksContainer.id = 'streamingLinks';
        container.appendChild(linksContainer);

        document.body.appendChild(container);

        // Add minimize functionality
        let isMinimized = false;
        title.style.cursor = 'pointer';
        title.addEventListener('click', () => {
            isMinimized = !isMinimized;
            linksContainer.style.display = isMinimized ? 'none' : 'block';
            if (inputContainer) inputContainer.style.display = isMinimized ? 'none' : 'flex';
            title.textContent = isMinimized ? '🎬 ▼' : '🎬 Streaming Links';
            container.style.transform = isMinimized ? 'translateY(70%)' : 'translateY(0)';
        });
    }

    function updateStreamingLinks() {
        const linksContainer = document.getElementById('streamingLinks');
        linksContainer.innerHTML = '';

        Object.entries(sourceUrls).forEach(([source, url]) => {
            const linkContainer = document.createElement('div');
            applyStyles(linkContainer, styles.linkContainer);

            const link = document.createElement('a');
            link.href = buildUrl(url, state.mediaId, state.mediaType, state.season, state.episode);
            link.textContent = source === 'frembed' ? `${source} 🇫🇷` : source;
            applyStyles(link, styles.link);
            link.target = '_blank';
            linkContainer.appendChild(link);

            const copyButton = document.createElement('button');
            copyButton.textContent = '📋';
            applyStyles(copyButton, styles.copyButton);

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
        if (baseUrl.includes('videasy')) {
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
