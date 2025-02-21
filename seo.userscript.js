// ==UserScript==
// @name         SEO Metadata Analyzer
// @namespace    http://tampermonkey.net/
// @version      1.3
// @description  Displays and analyzes page title and meta description for SEO compliance
// @author       Your name
// @match        *://*/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';




    console.log('SEO Analyzer script starting...');

    const createFloatingBox = () => {
        console.log('Creating floating box...');
        const box = document.createElement('div');
        box.id = 'seo-analyzer-box';
        box.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px;
            background: #ffffff;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            z-index: 999999;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            font-size: 13px;
            width: 280px;
            pointer-events: auto;
            border: 1px solid #f0f0f0;
            backdrop-filter: blur(10px);
            transition: all 0.3s ease;
        `;
        return box;
    };

    const SEO_GUIDELINES = {
        title: {
            min: 30,
            max: 60,
            getMessage: (length) => {
                if (length < 30) return 'Too short';
                if (length > 60) return 'Too long';
                return 'Optimal length';
            },
            getColor: (length) => {
                if (length >= 30 && length <= 60) return '#10B981'; // Modern green
                return '#EF4444'; // Modern red
            }
        },
        description: {
            min: 120,
            max: 155,
            getMessage: (length) => {
                if (length < 120) return 'Too short';
                if (length > 155) return 'Too long';
                return 'Optimal length';
            },
            getColor: (length) => {
                if (length >= 120 && length <= 155) return '#10B981'; // Modern green
                return '#EF4444'; // Modern red
            }
        }
    };

    // Create copy button with tooltip
    const createCopyButton = () => {
        const button = document.createElement('button');
        button.style.cssText = `
            padding: 4px 8px;
            background: rgba(255,255,255,0.2);
            border: none;
            border-radius: 4px;
            color: white;
            cursor: pointer;
            font-size: 11px;
            transition: all 0.2s ease;
            margin-left: 8px;
        `;
        button.textContent = 'Copy';

        const tooltip = document.createElement('div');
        tooltip.style.cssText = `
            position: absolute;
            background: #333;
            color: white;
            padding: 6px 10px;
            border-radius: 4px;
            font-size: 11px;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.2s ease;
            white-space: nowrap;
            z-index: 1000000;
        `;
        document.body.appendChild(tooltip);

        let tooltipTimeout;

        const showTooltip = (message, x, y) => {
            tooltip.textContent = message;
            tooltip.style.left = `${x}px`;
            tooltip.style.top = `${y - 30}px`;
            tooltip.style.opacity = '1';
        };

        const hideTooltip = () => {
            tooltip.style.opacity = '0';
        };

        button.addEventListener('mouseover', (e) => {
            showTooltip('Click to copy', e.clientX, e.clientY);
        });

        button.addEventListener('mouseout', () => {
            hideTooltip();
        });

        return { button, showTooltip, hideTooltip };
    };

    const createSection = (title, content, length, guidelines) => {
        const section = document.createElement('div');
        section.style.cssText = `
            margin-bottom: 8px;
            padding: 10px;
            background-color: ${guidelines.getColor(length)};
            border-radius: 8px;
            color: white;
            font-size: 12px;
            line-height: 1.5;
            position: relative;
        `;

        const { button, showTooltip, hideTooltip } = createCopyButton();

        const headerDiv = document.createElement('div');
        headerDiv.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 6px;
        `;

        const titleSpan = document.createElement('strong');
        titleSpan.style.fontWeight = '600';
        titleSpan.textContent = title;

        const rightSection = document.createElement('div');
        rightSection.style.cssText = `
            display: flex;
            align-items: center;
        `;

        const lengthSpan = document.createElement('span');
        lengthSpan.style.cssText = `
            opacity: 0.9;
            padding: 2px 6px;
            background: rgba(255,255,255,0.2);
            border-radius: 4px;
        `;
        lengthSpan.textContent = `${length} chars`;

        button.addEventListener('click', async (e) => {
            e.stopPropagation();
            try {
                await navigator.clipboard.writeText(content);
                showTooltip('Copied!', e.clientX, e.clientY);
                button.style.backgroundColor = 'rgba(255,255,255,0.3)';
                setTimeout(() => {
                    hideTooltip();
                    button.style.backgroundColor = 'rgba(255,255,255,0.2)';
                }, 1500);
            } catch (err) {
                showTooltip('Failed to copy', e.clientX, e.clientY);
                setTimeout(hideTooltip, 1500);
            }
        });

        rightSection.appendChild(lengthSpan);
        rightSection.appendChild(button);
        headerDiv.appendChild(titleSpan);
        headerDiv.appendChild(rightSection);

        section.innerHTML = `
            <div style="margin: 8px 0; word-wrap: break-word;">
                ${content}
            </div>
            <div style="font-size: 11px; opacity: 0.9; margin-top: 6px; text-align: right; padding: 4px 6px; background: rgba(255,255,255,0.1); border-radius: 4px;">
                ${guidelines.getMessage(length)}
            </div>
        `;

        section.insertBefore(headerDiv, section.firstChild);

        return section;
    };

    const analyzeMetadata = () => {
        console.log('Analyzing metadata...');

        const existingBox = document.getElementById('seo-analyzer-box');
        if (existingBox) {
            existingBox.remove();
        }

        const title = document.title;
        const metaDescription = document.querySelector('meta[name="description"]')?.getAttribute('content') || 'No meta description found';

        const titleLength = title.length;
        const descriptionLength = metaDescription.length;

        const box = createFloatingBox();

        const header = document.createElement('div');
        header.style.cssText = `
            margin-bottom: 12px;
            padding: 4px 0;
            font-weight: 600;
            font-size: 14px;
            color: #333;
            cursor: move;
            user-select: none;
            border-bottom: 1px solid #f0f0f0;
        `;
        header.textContent = 'SEO Analysis';
        box.appendChild(header);

        box.appendChild(createSection('Title', title, titleLength, SEO_GUIDELINES.title));
        box.appendChild(createSection('Meta Description', metaDescription, descriptionLength, SEO_GUIDELINES.description));

        document.body.appendChild(box);
        console.log('Box added to document body');

        // Make box draggable
        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;

        header.addEventListener('mousedown', (e) => {
            isDragging = true;
            initialX = e.clientX - box.offsetLeft;
            initialY = e.clientY - box.offsetTop;
            header.style.cursor = 'grabbing';
        });

        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                e.preventDefault();
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;
                box.style.left = currentX + 'px';
                box.style.top = currentY + 'px';
                box.style.right = 'auto';
            }
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
            header.style.cursor = 'move';
        });
    };

    analyzeMetadata();
    window.addEventListener('load', analyzeMetadata);
    document.addEventListener('DOMContentLoaded', analyzeMetadata);

    const checkInterval = setInterval(() => {
        if (document.readyState === 'complete') {
            analyzeMetadata();
            clearInterval(checkInterval);
        }
    }, 1000);
})();
