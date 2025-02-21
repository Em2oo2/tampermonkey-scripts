// ==UserScript==
// @name         TMDB to Frembed.live Link Generator
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  Creates a Frembed.live link when browsing TMDB pages with clipboard functionality
// @author       You
// @match        https://www.themoviedb.org/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const baseUrl = "https://frembed.live/api";

    // Function to extract content type and ID from URL
    function extractTMDBInfo() {
        const url = window.location.href;
        const pathMatch = url.match(/themoviedb\.org\/(movie|tv)\/(\d+)/);

        if (pathMatch) {
            return {
                type: pathMatch[1],
                id: pathMatch[2]
            };
        }

        return null;
    }

    // Function to create the Frembed URL
    function createFrembedUrl(info) {
        if (!info) return null;

        if (info.type === 'movie') {
            return `${baseUrl}/film.php?id=${info.id}`;
        } else if (info.type === 'tv') {
            // Default to Season 1, Episode 1 for TV shows
            return `${baseUrl}/serie.php?id=${info.id}&sa=1&epi=1`;
        }

        return null;
    }

    // Function to copy text to clipboard
    function copyToClipboard(text) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'absolute';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
    }

    // Function to add the links to the page
    function addLinksToPage() {
        const info = extractTMDBInfo();
        if (!info) {
            console.error('TMDB info not found');
            return;
        }

        const frembedUrl = createFrembedUrl(info);
        if (!frembedUrl) {
            console.error('Frembed URL not created');
            return;
        }

        // Create container for buttons
        const container = document.createElement('div');
        container.style.position = 'fixed';
        container.style.top = '70px';
        container.style.right = '20px';
        container.style.zIndex = '9999';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.gap = '10px';

        // Watch button
        const watchButton = document.createElement('a');
        watchButton.href = frembedUrl;
        watchButton.target = '_blank';
        watchButton.textContent = 'Watch on Frembed';
        watchButton.style.display = 'block';
        watchButton.style.padding = '10px 15px';
        watchButton.style.backgroundColor = '#01b4e4';
        watchButton.style.color = 'white';
        watchButton.style.borderRadius = '5px';
        watchButton.style.textDecoration = 'none';
        watchButton.style.fontWeight = 'bold';
        watchButton.style.textAlign = 'center';

        // Copy button
        const copyButton = document.createElement('button');
        copyButton.textContent = 'Copy Frembed Link';
        copyButton.style.display = 'block';
        copyButton.style.padding = '10px 15px';
        copyButton.style.backgroundColor = '#90cea1';
        copyButton.style.color = 'white';
        copyButton.style.border = 'none';
        copyButton.style.borderRadius = '5px';
        copyButton.style.fontWeight = 'bold';
        copyButton.style.cursor = 'pointer';
        copyButton.style.width = '100%';

        copyButton.addEventListener('click', function() {
            copyToClipboard(frembedUrl);

            // Change button text temporarily to show feedback
            const originalText = copyButton.textContent;
            copyButton.textContent = 'Copied!';
            setTimeout(() => {
                copyButton.textContent = originalText;
            }, 1500);
        });

        container.appendChild(watchButton);
        container.appendChild(copyButton);
        document.body.appendChild(container);
    }

    // Run when the page is fully loaded
    if (document.readyState === 'loading') {
        window.addEventListener('load', addLinksToPage);
    } else {
        addLinksToPage();
    }
})();
