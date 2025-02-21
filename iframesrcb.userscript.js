// ==UserScript==
// @name         Display Shortest iframe Src URL (Always Visible Button, Draggable, Collapsible)
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Display the shortest iframe src URL in a styled, draggable, collapsible container.
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

    let displayedUrls = [];
    let currentIndex = 0;

    // Create container
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

    // Create collapse button
    const collapseButton = document.createElement('button');
    collapseButton.innerHTML = '−';
    collapseButton.style.cssText = `
        position: absolute;
        top: 8px;
        right: 8px;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: none;
        background: rgba(0, 0, 0, 0.1);
        color: #666;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        padding: 0;
        transition: all 0.2s ease;
        z-index: 1;
    `;
    container.appendChild(collapseButton);

    // Create collapsed icon
    const collapsedIcon = document.createElement('div');
    collapsedIcon.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
            <path fill="white" d="M3 3h18v18H3V3zm16 16V5H5v14h14zM7 7h10v2H7V7zm0 4h10v2H7v-2zm0 4h7v2H7v-2z"/>
        </svg>
    `;
    collapsedIcon.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: #2ecc71;
        cursor: pointer;
        display: none;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(46, 204, 113, 0.3);
        z-index: 2147483647;
        transition: all 0.2s ease;
    `;
    document.body.appendChild(collapsedIcon);

    // Hover effects for collapsed icon
    collapsedIcon.addEventListener('mouseenter', () => {
        collapsedIcon.style.transform = 'scale(1.1)';
        collapsedIcon.style.boxShadow = '0 6px 16px rgba(46, 204, 113, 0.4)';
    });

    collapsedIcon.addEventListener('mouseleave', () => {
        collapsedIcon.style.transform = 'scale(1)';
        collapsedIcon.style.boxShadow = '0 4px 12px rgba(46, 204, 113, 0.3)';
    });

    // URL element creation
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

    // Loading message
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

    // Fetch iframe sources
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
        }
    }

    // Display current URL
    function displayCurrentUrl() {
        if (currentIndex < displayedUrls.length) {
            // Clear previous content except launch button and collapse button
            while (container.children.length > 2) {
                container.removeChild(container.lastChild);
            }

            container.appendChild(createIframeSrcElement(displayedUrls[currentIndex]));

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

    // Start iframe detection
    function startIframeDetection() {
        displayedUrls = [];
        currentIndex = 0;
        
        // Clear previous content except launch button and collapse button
        while (container.children.length > 2) {
            container.removeChild(container.lastChild);
        }
        
        displayLoadingMessage();
        fetchIframeSrc();
    }

    // Create launch button
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
        margin-top: 8px;
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

    // Collapse/Expand functionality
    let isCollapsed = false;

    function toggleCollapse() {
        isCollapsed = !isCollapsed;
        if (isCollapsed) {
            container.style.display = 'none';
            collapsedIcon.style.display = 'flex';
            collapsedIcon.style.top = container.style.top;
            collapsedIcon.style.right = container.style.right;
            if (container.style.left) {
                collapsedIcon.style.left = container.style.left;
                collapsedIcon.style.right = 'auto';
            }
        } else {
            container.style.display = 'flex';
            collapsedIcon.style.display = 'none';
            container.style.top = collapsedIcon.style.top;
            container.style.right = collapsedIcon.style.right;
            if (collapsedIcon.style.left) {
                container.style.left = collapsedIcon.style.left;
                container.style.right = 'auto';
            }
        }
    }

    collapseButton.addEventListener('click', toggleCollapse);
    collapsedIcon.addEventListener('click', toggleCollapse);

    // Add these improved drag functions after the initial variable declarations and before the event listeners

    function makeDraggable(element) {
        let isDragging = false;
        let startX, startY;
        let elementX, elementY;
        let bounds;

        function updateBounds() {
            bounds = {
                left: 0,
                top: 0,
                right: window.innerWidth - element.offsetWidth,
                bottom: window.innerHeight - element.offsetHeight
            };
        }

        function handleDragStart(e) {
            // Ignore if clicking on a button or interactive element
            if (e.target.tagName.toLowerCase() === 'button' || 
                e.target.classList.contains('clickable')) {
                return;
            }

            isDragging = true;
            updateBounds();
            
            // Get initial positions
            startX = e.clientX;
            startY = e.clientY;
            
            // Get current element position
            const rect = element.getBoundingClientRect();
            elementX = rect.left;
            elementY = rect.top;
            
            // Add dragging class for styling
            element.classList.add('dragging');
            
            // Change cursor
            element.style.cursor = 'grabbing';
            document.body.style.cursor = 'grabbing';
            
            // Disable text selection while dragging
            document.body.style.userSelect = 'none';
        }

        function handleDragMove(e) {
            if (!isDragging) return;
            
            // Calculate new position
            let dx = e.clientX - startX;
            let dy = e.clientY - startY;
            
            let newX = elementX + dx;
            let newY = elementY + dy;
            
            // Apply bounds constraints with smooth edge resistance
            if (newX < bounds.left) {
                newX = bounds.left + (newX - bounds.left) * 0.2;
            }
            if (newX > bounds.right) {
                newX = bounds.right + (newX - bounds.right) * 0.2;
            }
            if (newY < bounds.top) {
                newY = bounds.top + (newY - bounds.top) * 0.2;
            }
            if (newY > bounds.bottom) {
                newY = bounds.bottom + (newY - bounds.bottom) * 0.2;
            }
            
            // Apply new position with hardware acceleration
            element.style.transform = `translate3d(${newX}px, ${newY}px, 0)`;
            element.style.left = '0';
            element.style.top = '0';
        }

        function handleDragEnd() {
            if (!isDragging) return;
            isDragging = false;
            
            // Snap to bounds if outside
            const rect = element.getBoundingClientRect();
            let finalX = rect.left;
            let finalY = rect.top;
            
            updateBounds();
            
            finalX = Math.min(Math.max(finalX, bounds.left), bounds.right);
            finalY = Math.min(Math.max(finalY, bounds.top), bounds.bottom);
            
            // Apply final position
            element.style.transition = 'transform 0.2s ease-out';
            element.style.transform = `translate3d(${finalX}px, ${finalY}px, 0)`;
            
            // Reset styles
            setTimeout(() => {
                element.style.transition = '';
            }, 200);
            
            element.classList.remove('dragging');
            element.style.cursor = 'grab';
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        }

        // Add event listeners
        element.addEventListener('mousedown', handleDragStart);
        window.addEventListener('mousemove', handleDragMove);
        window.addEventListener('mouseup', handleDragEnd);
        window.addEventListener('resize', updateBounds);

        // Add touch support
        element.addEventListener('touchstart', (e) => {
            const touch = e.touches[0];
            handleDragStart({
                clientX: touch.clientX,
                clientY: touch.clientY,
                target: e.target
            });
        });

        window.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            e.preventDefault();
            const touch = e.touches[0];
            handleDragMove({
                clientX: touch.clientX,
                clientY: touch.clientY
            });
        }, { passive: false });

        window.addEventListener('touchend', handleDragEnd);

        // Add initial styles
        element.style.cursor = 'grab';
        element.style.position = 'fixed';
        element.style.userSelect = 'none';
        
        // Add CSS for drag visual feedback
        const style = document.createElement('style');
        style.textContent = `
            .dragging {
                opacity: 0.9;
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2) !important;
            }
        `;
        document.head.appendChild(style);
    }

    // Replace the old drag event listeners with this new implementation
    makeDraggable(container);
    makeDraggable(collapsedIcon);

    console.log('Script fully initialized with collapse functionality');
})();
