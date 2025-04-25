// ==UserScript==
// @name         SEO Heading Labeler with Color Matching
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Adds heading type labels (h1, h2, etc.) next to headings with matching colors
// @author       YourName
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // List of domains to exclude
    const excludedDomains = [
        'google.com', 
        'google.fr', 
        'google.de', 
        'google.co.uk', 
        'google.it', 
        'google.es', 
        'google.nl', 
        'google.ca', 
        'google.com.au', 
        'google.com.br', 
        'google.co.jp', 
        'google.ru', 
        'google.cn', 
        'google.in', 
        'google.ie', 
        'google.se', 
        'google.pl', 
        'google.be', 
        'gmail.com',
        'docs.google.com',
        'drive.google.com',
        'sheets.google.com',
        'slides.google.com',
        'calendar.google.com',
        'mail.google.com',
        'meet.google.com',
        'chat.google.com',
        'classroom.google.com',
        'aistudio.google.com',
        'mail-edu.univ-fcomte.fr',
        'gemini.google.com',
        'notion.so',
        'notion.site',
        'notion.com',
        'notion.ai',
        'chat.openai.com',
        'chatgpt.com',
        'openai.com',
        'claude.ai',
        'anthropic.com',
        'mistral.ai',
        'perplexity.ai',
        'poe.com',
        'deepseek.com',
        'cohere.com',
        'huggingface.co',
        'phind.com',
        'you.com',
        'bard.google.com',
        'duet.google.com'
    ];

    // Check if current domain should be excluded
    const currentDomain = window.location.hostname;
    const currentPath = window.location.pathname;
    const isExcluded = excludedDomains.some(domain => 
        currentDomain === domain || currentDomain.endsWith('.' + domain)
    );

    // Check for WordPress admin (wp-admin) or PrestaShop admin (/admin)
    const isWordPressAdmin = currentPath.includes('wp-admin');
    const isPrestaShopAdmin = currentPath.includes('/admin');

    if (isExcluded || isWordPressAdmin || isPrestaShopAdmin) {
        console.log('Skipping execution on excluded page:', currentDomain + currentPath);
        return;
    }
    
    // Function to get the actual color of an element
    function getElementColor(element) {
        // Get computed style
        const style = window.getComputedStyle(element);
        // Return the color property
        return style.color;
    }

    // Function to add labels to headings
    function labelHeadings() {
        // Get all heading elements from h1 to h6
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');

        headings.forEach(heading => {
            // Check if this heading already has a label
            if (heading.dataset.labeled === 'true') {
                return;
            }

            // Get the heading's color
            const headingColor = getElementColor(heading);

            // Create the label element
            const label = document.createElement('span');
            label.textContent = ` (${heading.tagName.toLowerCase()})`;
            label.style.color = headingColor; // Match heading color
            label.style.opacity = '0.7'; // Slightly transparent
            label.style.fontSize = '0.8em';
            label.style.fontWeight = 'normal';
            label.style.fontFamily = 'montserrat';
            label.style.marginLeft = '5px';
            label.style.fontStyle = 'italic';

            // Append the label to the heading
            heading.appendChild(label);

            // Mark the heading as labeled
            heading.dataset.labeled = 'true';
        });
    }

    // Run the function when the page loads
    window.addEventListener('load', labelHeadings);

    // Also run it when the DOM changes (for dynamically loaded content)
    const observer = new MutationObserver(labelHeadings);
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
})();
