// ==UserScript==
// @name         Selected Character Counter
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Displays the number of selected characters at the bottom right of the screen
// @author       Your Name
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Create the counter element
    const counter = document.createElement('div');
    counter.id = 'selectionCharCounter';
    counter.style.position = 'fixed';
    counter.style.bottom = '20px';
    counter.style.right = '20px';
    counter.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    counter.style.color = 'white';
    counter.style.padding = '5px 10px';
    counter.style.borderRadius = '4px';
    counter.style.fontFamily = 'Arial, sans-serif';
    counter.style.fontSize = '14px';
    counter.style.zIndex = '9999';
    counter.style.display = 'none';
    counter.style.boxShadow = '0 2px 5px rgba(0,0,0,0.3)';
    document.body.appendChild(counter);

    // Function to update the counter
    function updateCounter() {
        const selection = window.getSelection();
        const selectedText = selection.toString();
        
        if (selectedText.length > 0) {
            counter.textContent = `${selectedText.length} chars selected`;
            counter.style.display = 'block';
        } else {
            counter.style.display = 'none';
        }
    }

    // Add event listeners for selection changes
    document.addEventListener('selectionchange', updateCounter);
    document.addEventListener('mouseup', updateCounter);
    document.addEventListener('keyup', function(e) {
        // Check if Shift, Ctrl, or Cmd keys are pressed (for keyboard selections)
        if (e.shiftKey || e.ctrlKey || e.metaKey) {
            updateCounter();
        }
    });
})();
