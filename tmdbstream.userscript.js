// ==UserScript==
// @name         TMDB Streaming Links with Clipboard Copy
// @namespace    http://tampermonkey.net/
// @version      1.5
// @description  Display streaming links on TMDB pages with clipboard copy buttons
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
        videasy: 'https://player.videasy.net' // New streaming source
    };

    let state = {
        mediaId: null,
        mediaType: null,
        season: 1,
        episode: 1
    };

    // Get media ID and type from URL
    function getMediaInfo() {
        const path = window.location.pathname;
        const match = path.match(/\/(movie|tv)\/(\d+)/);
        if (match) {
            state.mediaId = match[2];
            state.mediaType = match[1];
        }
    }

    // Create input fields for season and episode
    function createInputFields() {
        const container = document.createElement('div');
        container.style.position = 'fixed';
        container.style.bottom = '20px';
        container.style.right = '20px';
        container.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        container.style.padding = '10px';
        container.style.borderRadius = '5px';
        container.style.zIndex = '1000';
        container.style.color = '#fff';

        const title = document.createElement('h3');
        title.textContent = 'Streaming Links';
        title.style.margin = '0 0 10px 0';
        container.appendChild(title);

        if (state.mediaType === 'tv') {
            const seasonLabel = document.createElement('label');
            seasonLabel.textContent = 'Season: ';
            const seasonInput = document.createElement('input');
            seasonInput.type = 'number';
            seasonInput.id = 'seasonInput';
            seasonInput.value = state.season;
            seasonInput.min = 1;
            seasonInput.style.width = '50px';
            seasonInput.style.marginRight = '10px';
            seasonLabel.appendChild(seasonInput);
            container.appendChild(seasonLabel);

            const episodeLabel = document.createElement('label');
            episodeLabel.textContent = 'Episode: ';
            const episodeInput = document.createElement('input');
            episodeInput.type = 'number';
            episodeInput.id = 'episodeInput';
            episodeInput.value = state.episode;
            episodeInput.min = 1;
            episodeInput.style.width = '50px';
            episodeLabel.appendChild(episodeInput);
            container.appendChild(episodeLabel);

            // Add event listeners for input changes
            seasonInput.addEventListener('change', () => {
                state.season = parseInt(seasonInput.value, 10);
                updateStreamingLinks();
            });

            episodeInput.addEventListener('change', () => {
                state.episode = parseInt(episodeInput.value, 10);
                updateStreamingLinks();
            });
        }

        const linksContainer = document.createElement('div');
        linksContainer.id = 'streamingLinks';
        container.appendChild(linksContainer);

        document.body.appendChild(container);
    }

    // Update streaming links based on media type, season, and episode
    function updateStreamingLinks() {
        const linksContainer = document.getElementById('streamingLinks');
        linksContainer.innerHTML = '';

        Object.keys(sourceUrls).forEach(source => {
            const linkContainer = document.createElement('div');
            linkContainer.style.display = 'flex';
            linkContainer.style.alignItems = 'center';
            linkContainer.style.marginBottom = '5px';

            const link = document.createElement('a');
            link.href = buildUrl(sourceUrls[source], state.mediaId, state.mediaType, state.season, state.episode);
            link.textContent = source;
            link.style.color = '#fff';
            link.style.textDecoration = 'none';
            link.style.marginRight = '10px';
            link.target = '_blank';
            linkContainer.appendChild(link);

            const copyButton = document.createElement('button');
            copyButton.textContent = '📋';
            copyButton.style.background = 'none';
            copyButton.style.border = 'none';
            copyButton.style.color = '#fff';
            copyButton.style.cursor = 'pointer';
            copyButton.style.fontSize = '14px';
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

    // Build URL for streaming links
    function buildUrl(baseUrl, mediaId, mediaType, season = 1, episode = 1) {
        if (baseUrl.includes('videasy')) {
            if (mediaType === 'tv') {
                return `${baseUrl}/tv/${mediaId}/${season}/${episode}`;
            } else {
                return `${baseUrl}/movie/${mediaId}`;
            }
        } else if (mediaType === 'tv') {
            return `${baseUrl}/tv/${mediaId}/${season}/${episode}`;
        } else {
            return `${baseUrl}/movie/${mediaId}`;
        }
    }

    // Initialize the script
    function init() {
        getMediaInfo();
        createInputFields();
        updateStreamingLinks();
    }

    init();
})();
