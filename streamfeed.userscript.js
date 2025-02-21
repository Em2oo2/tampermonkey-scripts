// ==UserScript==
// @name         M3U8 Stream Detector with Quality Analysis
// @namespace    http://your.school.edu
// @version      1.0
// @description  Detects M3U8 streams and analyzes quality
// @match        *://*/*
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_setClipboard
// ==/UserScript==

(function() {
    'use strict';

    // Configuration
    const DEBUG = true;
    const STREAM_LOG = [];

    // Helper function to detect M3U8 content
    function isM3U8Content(url, content) {
        return content.includes('#EXTM3U') || url.endsWith('.m3u8');
    }

    // Function to analyze quality metrics
    function analyzeQuality(content) {
        const bandwidthMatch = content.match(/BANDWIDTH=(\d+)/g);
        const resolutionMatch = content.match(/RESOLUTION=(\d+x\d+)/g);

        let maxBandwidth = 0;
        let maxResolution = 0;

        if (bandwidthMatch) {
            maxBandwidth = Math.max(...bandwidthMatch.map(b => parseInt(b.split('=')[1])));
        }

        if (resolutionMatch) {
            maxResolution = Math.max(...resolutionMatch.map(r => {
                const [width, height] = r.split('=')[1].split('x');
                return parseInt(width) * parseInt(height);
            }));
        }

        // Calculate quality score (0-100)
        let qualityScore = 0;
        if (maxBandwidth > 0) {
            // Higher bandwidth generally means better quality
            // 8000000 (8mbps) would give a score of 100
            qualityScore = Math.min(100, (maxBandwidth / 8000000) * 100);
        }

        return {
            maxBandwidth,
            maxResolution,
            qualityScore: Math.round(qualityScore)
        };
    }

    // Function to format bandwidth in readable format
    function formatBandwidth(bandwidth) {
        if (bandwidth === 'unknown') return 'unknown';
        const mbps = bandwidth / 1000000;
        return mbps.toFixed(2) + ' Mbps';
    }

    // Function to analyze stream data
    function analyzeStream(url, content) {
        const quality = analyzeQuality(content);
        const streamInfo = {
            timestamp: new Date().toISOString(),
            url: url,
            resolution: content.match(/#EXT-X-STREAM-INF:.*RESOLUTION=(\d+x\d+)/)?.[1] || 'unknown',
            bandwidth: quality.maxBandwidth || 'unknown',
            segments: content.split('\n').filter(line => line.trim().length > 0 && !line.startsWith('#')).length,
            qualityScore: quality.qualityScore
        };

        STREAM_LOG.push(streamInfo);

        // Sort streams by quality score
        STREAM_LOG.sort((a, b) => b.qualityScore - a.qualityScore);

        if (DEBUG) {
            console.log('Stream detected:', streamInfo);
        }

        return streamInfo;
    }

    // Function to create a copy button
    function createCopyButton(url) {
        const button = document.createElement('button');
        button.textContent = 'Copy';
        button.style.padding = '2px 5px';
        button.style.cursor = 'pointer';
        button.style.background = '#4CAF50';
        button.style.border = 'none';
        button.style.color = 'white';
        button.style.borderRadius = '3px';
        button.style.marginLeft = '5px';

        button.addEventListener('click', function() {
            GM_setClipboard(url);
            button.textContent = 'Copied!';
            setTimeout(() => {
                button.textContent = 'Copy';
            }, 1000);
        });

        return button;
    }

    // Function to get quality indicator color
    function getQualityColor(score) {
        if (score >= 80) return '#4CAF50'; // Green
        if (score >= 60) return '#FFA500'; // Orange
        if (score >= 40) return '#FF7F50'; // Coral
        return '#FF6347'; // Tomato
    }

    // Rest of the interceptor functions remain the same
    function interceptXHR() {
        const XHR = XMLHttpRequest.prototype;
        const open = XHR.open;
        const send = XHR.send;

        XHR.open = function(method, url) {
            this._url = url;
            return open.apply(this, arguments);
        };

        XHR.send = function() {
            this.addEventListener('load', function() {
                try {
                    const content = this.responseText;
                    if (isM3U8Content(this._url, content)) {
                        const streamInfo = analyzeStream(this._url, content);
                        GM_setValue('lastStream', JSON.stringify(streamInfo));
                    }
                } catch (e) {
                    if (DEBUG) {
                        console.error('Error processing response:', e);
                    }
                }
            });

            return send.apply(this, arguments);
        };
    }

    // Fetch interceptor remains the same
    function interceptFetch() {
        const originalFetch = window.fetch;
        window.fetch = async function(resource, init) {
            const response = await originalFetch.apply(this, arguments);

            if (response.ok) {
                const url = typeof resource === 'string' ? resource : resource.url;
                const clonedResponse = response.clone();

                try {
                    const content = await clonedResponse.text();
                    if (isM3U8Content(url, content)) {
                        const streamInfo = analyzeStream(url, content);
                        GM_setValue('lastStream', JSON.stringify(streamInfo));
                    }
                } catch (e) {
                    if (DEBUG) {
                        console.error('Error processing fetch response:', e);
                    }
                }
            }

            return response;
        };
    }

    // Initialize
    function init() {
        interceptXHR();
        interceptFetch();

        if (DEBUG) {
            console.log('M3U8 Stream Detector initialized');
        }

        // Add a simple UI for viewing detected streams
        const container = document.createElement('div');
        container.style.position = 'fixed';
        container.style.bottom = '10px';
        container.style.right = '10px';
        container.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        container.style.color = 'white';
        container.style.padding = '10px';
        container.style.borderRadius = '5px';
        container.style.zIndex = '9999';
        container.style.fontSize = '12px';
        container.style.maxHeight = '200px';
        container.style.overflowY = 'auto';
        container.style.maxWidth = '600px';
        container.id = 'stream-detector-ui';

        document.body.appendChild(container);

        // Update UI periodically
        setInterval(() => {
            const container = document.getElementById('stream-detector-ui');
            if (container && STREAM_LOG.length > 0) {
                container.innerHTML = `<strong>Detected Streams (${STREAM_LOG.length}) - Sorted by Quality:</strong><br>`;

                STREAM_LOG.forEach((stream, index) => {
                    const streamDiv = document.createElement('div');
                    streamDiv.style.marginTop = '10px';
                    streamDiv.style.padding = '5px';
                    streamDiv.style.border = `2px solid ${getQualityColor(stream.qualityScore)}`;
                    streamDiv.style.borderRadius = '4px';

                    streamDiv.innerHTML = `
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <strong>Quality Score: ${stream.qualityScore}/100</strong>
                            <span style="color: ${getQualityColor(stream.qualityScore)}">
                                ${index === 0 ? '★ BEST QUALITY' : ''}
                            </span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 5px; word-break: break-all;">
                            <span>URL: ${stream.url}</span>
                        </div>
                        Resolution: ${stream.resolution}<br>
                        Bandwidth: ${formatBandwidth(stream.bandwidth)}<br>
                        Segments: ${stream.segments}
                    `;

                    const urlDiv = streamDiv.querySelector('div');
                    urlDiv.appendChild(createCopyButton(stream.url));

                    container.appendChild(streamDiv);
                });
            }
        }, 1000);
    }

    init();
})();
