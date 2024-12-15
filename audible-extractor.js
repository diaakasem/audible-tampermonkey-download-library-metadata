// ==UserScript==
// @name         Audible Library Data Extractor
// @namespace    http://tampermonkey.net/
// @version      1.3
// @description  Extract Audible library data into an array of JSON objects
// @author       Diaa Kasem
// @match        https://www.audible.com/lib*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // Helper function to wait for elements
    function waitFor(selector, callback, interval = 100, timeout = 10000) {
        const startTime = Date.now();
        const check = setInterval(() => {
            const element = document.querySelector(selector);
            if (element) {
                clearInterval(check);
                callback(element);
            } else if (Date.now() - startTime > timeout) {
                clearInterval(check);
                console.error(`Timeout waiting for ${selector}`);
            }
        }, interval);
    }

    // Extract data from the current page
    function extractData() {
        const books = [];
        const items = document.querySelectorAll('.adbl-library-content-row');

        items.forEach((item) => {
            const asinMatch = item.id.match(/^adbl-library-content-row-(.+)$/);
            const asin = asinMatch ? asinMatch[1] : 'Unknown';

            const title = item.querySelector('.bc-heading, .bc-text.bc-size-headline3')?.innerText.trim() || 'Unknown';
            const author = item.querySelector('.authorLabel a')?.innerText.trim() || 'Unknown';
            const narrator = Array.from(item.querySelectorAll('.narratorLabel a')).map((n) => n.innerText.trim()).join(', ') || 'Unknown';

            // Determine the status (finished, in progress, or time remaining)
            let status = 'Unknown';
            let timeRemaining = 'Unknown';

            const finishedElement = document.querySelector(`#time-remaining-finished-${asin}`);
            const inProgressElement = item.querySelector('.bc-meter-bar');
            const timeRemainingElement = document.querySelector(`#time-remaining-display-${asin} .bc-text.bc-color-secondary`);


            if (finishedElement) {
                status = 'Finished';
                timeRemaining = '0h 0m';
            }
            if (inProgressElement) {
                status = 'In Progress';
                timeRemaining = timeRemainingElement?.innerText.trim() || 'Unknown';
            } else if (timeRemainingElement) {
                status = 'Not Started';
                timeRemaining = timeRemainingElement?.innerText.trim() || 'Unknown';
            }

            const length = item.querySelector('.adbl-library-action .bc-text.bc-color-secondary + span')?.innerText.trim() || 'Unknown';
            const imageUrl = item.querySelector('img.bc-image-inset-border')?.src || '';

            books.push({
                asin,
                title,
                author,
                narrator,
                status,
                timeRemaining,
                length,
                imageUrl,
            });
        });

        return books;
    }

    // Main function
    function collectAudibleLibraryData() {
        let allBooks = [];
        const nextButtonSelector = '.adbl-library-next-button';

        function processNextPage() {
            const pageBooks = extractData();
            allBooks = allBooks.concat(pageBooks);

            const nextButton = document.querySelector(nextButtonSelector);
            if (nextButton && !nextButton.disabled) {
                nextButton.click();
                waitFor('.adbl-library-content-row', processNextPage);
            } else {
                console.log('Library data collected:', allBooks);
                console.log(JSON.stringify(allBooks, null, 2));
                alert('Data collection complete. Check the console for results.');
            }
        }

        processNextPage();
    }

    // Wait for the library page to load
    waitFor('.adbl-library-content-row', collectAudibleLibraryData);
})();
