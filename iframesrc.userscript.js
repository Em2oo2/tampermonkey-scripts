// ==UserScript==
// @name         Display Shortest iframe Src URL (Always Visible Button, Draggable)
// @namespace    http://tampermonkey.net/
// @version      1.9
// @description  Display the shortest iframe src URL in a styled, draggable container. The "Find iframe URL" button is always visible, and the URL panel appears below it after clicking.
// @author       You
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    console.log('Script initialized');

    if (window.self !== window.top) {
        console.log('Script is running inside an iframe. Exiting.');
        return;
    }

    // Create a draggable container with improved styling
    const container = document.createElement('div');
    container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px;
        background: rgba(255, 255, 255, 0.95);
        border-radius: 16px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        z-index: 2147483647;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        font-size: 14px;
        width: min(320px, calc(100vw - 40px));
        pointer-events: auto;
        border: 1px solid rgba(0, 0, 0, 0.1);
        backdrop-filter: blur(10px);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        display: flex;
        flex-direction: column;
        gap: 16px;
    `;
    document.body.appendChild(container);

    // Draggable functionality remains the same
    let isDragging = false;
    let offsetX, offsetY;

    container.addEventListener('mousedown', (e) => {
        if (e.target === container) {
            isDragging = true;
            offsetX = e.clientX - container.getBoundingClientRect().left;
            offsetY = e.clientY - container.getBoundingClientRect().top;
        }
    });

    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            container.style.left = `${e.clientX - offsetX}px`;
            container.style.top = `${e.clientY - offsetY}px`;
            container.style.right = 'unset';
        }
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
    });

    let displayedUrls = [];
    let currentIndex = 0;

    // Enhanced URL element creation
    function createIframeSrcElement(src) {
        const link = document.createElement('div');
        link.textContent = src;
        link.style.cssText = `
            padding: 12px;
            margin: 8px 0;
            background: rgba(0, 123, 255, 0.1);
            border-radius: 8px;
            cursor: pointer;
            word-break: break-all;
            color: #0066cc;
            font-weight: 500;
            transition: all 0.2s ease;
            border: 1px solid rgba(0, 123, 255, 0.2);
        `;
        link.title = 'Click to copy URL';

        link.addEventListener('mouseenter', () => {
            link.style.background = 'rgba(0, 123, 255, 0.15)';
        });

        link.addEventListener('mouseleave', () => {
            link.style.background = 'rgba(0, 123, 255, 0.1)';
        });

        link.addEventListener('click', () => {
            navigator.clipboard.writeText(src).then(() => {
                // Create and show a toast notification
                const toast = document.createElement('div');
                toast.textContent = 'URL copied to clipboard';
                toast.style.cssText = `
                    position: fixed;
                    bottom: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    padding: 12px 24px;
                    background: #333;
                    color: white;
                    border-radius: 8px;
                    font-size: 14px;
                    z-index: 2147483647;
                    animation: fadeInOut 2s ease forwards;
                `;

                // Add keyframe animation
                const style = document.createElement('style');
                style.textContent = `
                    @keyframes fadeInOut {
                        0% { opacity: 0; transform: translate(-50%, 20px); }
                        15% { opacity: 1; transform: translate(-50%, 0); }
                        85% { opacity: 1; transform: translate(-50%, 0); }
                        100% { opacity: 0; transform: translate(-50%, -20px); }
                    }
                `;
                document.head.appendChild(style);

                document.body.appendChild(toast);
                setTimeout(() => toast.remove(), 2000);
            });
        });

        return link;
    }

    // Enhanced loading message
    function displayLoadingMessage() {
        const loadingMessage = document.createElement('div');
        loadingMessage.textContent = 'Searching for iframes...';
        loadingMessage.style.cssText = `
            padding: 12px;
            text-align: center;
            color: #666;
            font-style: italic;
            background: rgba(0, 0, 0, 0.05);
            border-radius: 8px;
            animation: pulse 1.5s ease-in-out infinite;
        `;

        const style = document.createElement('style');
        style.textContent = `
            @keyframes pulse {
                0% { opacity: 0.6; }
                50% { opacity: 1; }
                100% { opacity: 0.6; }
            }
        `;
        document.head.appendChild(style);

        container.appendChild(loadingMessage);
    }

    // Main functionality remains the same
    function fetchIframeSrc() {
        const iframes = document.getElementsByTagName('iframe');
        let iframeUrls = [];

        for (let iframe of iframes) {
            if (iframe.src) {
                iframeUrls.push(iframe.src);
            }
        }

        console.log(`Found ${iframeUrls.length} iframes with src attributes`);

        displayedUrls = iframeUrls.sort((a, b) => a.length - b.length);
        currentIndex = 0;

        if (displayedUrls.length > 0) {
            displayCurrentUrl();
        } else {
            const noIframesMessage = document.createElement('div');
            noIframesMessage.textContent = 'No iframes found';
            noIframesMessage.style.cssText = `
                padding: 12px;
                text-align: center;
                color: #666;
                background: rgba(0, 0, 0, 0.05);
                border-radius: 8px;
                font-style: italic;
            `;
            container.appendChild(noIframesMessage);
            console.log('No iframes with src attributes found.');
        }
    }

    function displayCurrentUrl() {
        if (currentIndex < displayedUrls.length) {
            const url = displayedUrls[currentIndex];

            while (container.children.length > 1) {
                container.removeChild(container.lastChild);
            }

            container.appendChild(createIframeSrcElement(url));

            const notFoundButton = document.createElement('button');
            notFoundButton.textContent = 'Not what I\'m looking for';
            notFoundButton.style.cssText = `
                padding: 12px 20px;
                background: #ff4757;
                color: white;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                width: 100%;
                transition: all 0.2s ease;
                margin-top: 8px;
                box-shadow: 0 2px 8px rgba(255, 71, 87, 0.2);
            `;

            notFoundButton.addEventListener('mouseenter', () => {
                notFoundButton.style.background = '#ff3248';
                notFoundButton.style.transform = 'translateY(-1px)';
            });

            notFoundButton.addEventListener('mouseleave', () => {
                notFoundButton.style.background = '#ff4757';
                notFoundButton.style.transform = 'translateY(0)';
            });

            notFoundButton.addEventListener('click', () => {
                currentIndex++;
                if (currentIndex < displayedUrls.length) {
                    displayCurrentUrl();
                } else {
                    const noMoreUrlsMessage = document.createElement('div');
                    noMoreUrlsMessage.textContent = 'No more URLs found';
                    noMoreUrlsMessage.style.cssText = `
                        padding: 12px;
                        text-align: center;
                        color: #666;
                        background: rgba(0, 0, 0, 0.05);
                        border-radius: 8px;
                        font-style: italic;
                        margin-top: 8px;
                    `;
                    container.appendChild(noMoreUrlsMessage);
                }
            });

            container.appendChild(notFoundButton);
        }
    }

    function startIframeDetection() {
        displayedUrls = [];
        currentIndex = 0;
        console.log('Starting iframe detection...');
        displayLoadingMessage();
        fetchIframeSrc();
    }

    // Enhanced launch button
    const launchButton = document.createElement('button');
    launchButton.textContent = 'Find iframe URL';
    launchButton.style.cssText = `
        padding: 12px 20px;
        background: linear-gradient(135deg, #2ecc71, #27ae60);
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        width: 100%;
        transition: all 0.2s ease;
        box-shadow: 0 4px 12px rgba(46, 204, 113, 0.2);
    `;

    launchButton.addEventListener('mouseenter', () => {
        launchButton.style.transform = 'translateY(-1px)';
        launchButton.style.boxShadow = '0 6px 16px rgba(46, 204, 113, 0.3)';
    });

    launchButton.addEventListener('mouseleave', () => {
        launchButton.style.transform = 'translateY(0)';
        launchButton.style.boxShadow = '0 4px 12px rgba(46, 204, 113, 0.2)';
    });

    launchButton.addEventListener('click', startIframeDetection);
    container.appendChild(launchButton);

    console.log('Manual launch button added. Click to start iframe detection.');
})();
