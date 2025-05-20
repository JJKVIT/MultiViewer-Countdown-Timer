/**
 * @file findElement.js
 * @description This script observes URL changes and injects a custom element into the page when a specific URL is matched.
 */

let lastProcessedUrl = null;
let checkElementIntervalId = null;
let countdownIntervalId = null; // New variable to store the countdown interval ID

/**
 * MutationObserver to detect URL changes.
 * When the URL changes, it checks if the new URL matches the target page and starts/stops an interval accordingly.
 */

const urlChangeObserver = new MutationObserver(() => {
  // Check if the current URL is different from the last processed URL
  if (location.href !== lastProcessedUrl || lastProcessedUrl === null) {
    console.log('URL changed:', location.href);

    const targetUrlPath = '/page/395';

    // Check if the current URL includes the target path
    if (location.href.includes(targetUrlPath)) {
      console.log(`Mapsd to target page: ${targetUrlPath}. Starting element check interval.`);
      // Clear any existing interval before starting a new one
      if (checkElementIntervalId !== null) {
        clearInterval(checkElementIntervalId);
      }
      // Clear countdown interval if navigating to the page again
      if (countdownIntervalId !== null) {
        clearInterval(countdownIntervalId);
        countdownIntervalId = null;
      }

      // Start an interval to periodically check for the target element
      checkElementIntervalId = setInterval(() => {
        const targetCardElement = document.querySelector('.MuiPaper-root.MuiPaper-elevation.MuiPaper-rounded.MuiPaper-elevation1.MuiCard-root.css-1wou66g');

        if (targetCardElement) {
          console.log('Target element found. Inserting middle div.');
          insertMiddleDiv(targetCardElement);
          // Clear the interval once the element is found and processed
          clearInterval(checkElementIntervalId);
          checkElementIntervalId = null;
        } else {
          console.log('Target element not found yet.');
        }
      }, 2000); // Check every 2 seconds
    } else {
      console.log(`Mapsd away from target page: ${targetUrlPath}. Clearing element check interval.`);
      // If the URL changes away from the target page, clear the interval
      if (checkElementIntervalId !== null) {
        clearInterval(checkElementIntervalId);
        checkElementIntervalId = null;
      }
      // Also clear the countdown interval if navigating away
      if (countdownIntervalId !== null) {
        clearInterval(countdownIntervalId);
        countdownIntervalId = null;
      }
    }
    // Update the last processed URL
    lastProcessedUrl = location.href;
  }
});

// Start observing the document body for subtree and child list changes
urlChangeObserver.observe(document, { subtree: true, childList: true });

/**
 * Converts a date/time range string in the format "Weekday, Day Month, HH:MM-HH:MM"
 * into two Date objects: one for the start time and one for the end time.
 * It assumes the date is for the current year, unless that date has already passed
 * this year, in which case it assumes the date is for the next year.
 *
 * @param {string} dateRangeString - The date/time range string (e.g., "Thu, 15 May, 20:00-21:00").
 * @returns {{startDate: Date, endDate: Date} | null} An object containing startDate and endDate Date objects, or null if the input format is invalid.
 */
function convertStringToDate(dateRangeString) {
  // Define a mapping from month names to their 0-indexed number (Jan=0, Dec=11)
  const monthMap = {
    "Jan": 0, "Feb": 1, "Mar": 2, "Apr": 3, "May": 4, "Jun": 5,
    "Jul": 6, "Aug": 7, "Sep": 8, "Oct": 9, "Nov": 10, "Dec": 11
  };

  // Split the string into three main parts: Weekday, Day Month, Time Range
  const parts = dateRangeString.split(', ');
  // Basic format validation (expecting 3 parts)
  if (parts.length !== 3) {
    console.error(`Invalid string format: "${dateRangeString}". Expected "Weekday, Day Month, HH:MM-HH:MM".`);
    return null;
  }

  // --- Parse the Date Part (e.g., "15 May") ---
  const dayMonthPart = parts[1].split(' ');
  if (dayMonthPart.length !== 2) {
    console.error(`Invalid Day Month format in "${dateRangeString}". Expected "Day Month".`);
    return null;
  }
  const day = parseInt(dayMonthPart[0], 10);
  const monthStr = dayMonthPart[1]; // e.g., "May"
  const monthIndex = monthMap[monthStr]; // Get the month index (e.g., 4 for May)
  // Check if the month name was valid
  if (monthIndex === undefined) {
    console.error(`Invalid month name: "${monthStr}" in "${dateRangeString}".`);
    return null;
  }

  // --- Parse the Time Range Part (e.g., "20:00-21:00") ---
  const timeRangePart = parts[2].split("–"); // Use the en-dash as the delimiter
  if (timeRangePart.length !== 2) {
    console.error(`Invalid Time Range format in "${dateRangeString}". Expected "HH:MM-HH:MM".`);
    return null;
  }
  const startTimeString = timeRangePart[0]; // e.g., "20:00"
  const endTimeString = timeRangePart[1]; // e.g., "21:00"

  // Parse Start Time (HH:MM)
  const startTimeParts = startTimeString.split(':');
  if (startTimeParts.length !== 2) {
    console.error(`Invalid Start Time format in "${dateRangeString}". Expected "HH:MM".`);
    return null;
  }
  const startHours = parseInt(startTimeParts[0], 10);
  const startMinutes = parseInt(startTimeParts[1], 10);


  // --- Validate parsed values ---
  if (isNaN(day) || day < 1 || day > 31 || // Basic day check (doesn't validate against month length)
    isNaN(startHours) || startHours < 0 || startHours > 23 ||
    isNaN(startMinutes) || startMinutes < 0 || startMinutes > 59
  ) {
    console.error(`Invalid numeric values in "${dateRangeString}". Day: ${day}, Start: ${startTimeString}, End: ${endTimeString}`);
    return null;
  }

  // --- Determine the correct Year (current year or next year) ---
  const now = new Date();
  let year = now.getFullYear();

  // Create a Date object for the START time using the *current* year
  // Note: Month index is 0-based in Date constructor
  let startDate = new Date(year, monthIndex, day, startHours, startMinutes, 0, 0); // Set seconds/milliseconds to 0

  // Check if this calculated START date/time in the current year is in the past
  // compared to the current date/time.
  if (startDate.getTime() <= now.getTime()) {
    // If it's in the past, try for the next year
    startDate.setFullYear(year + 1);
    // If it's still in the past, it means the event has passed entirely or is invalid
    if (startDate.getTime() <= now.getTime()) {
        console.log("Event in the past, calling getLatest again to find a new event.");
        return getLatest(); //Calls the function again to get the live event or determine that all events are over
    }
  }
  return startDate; // Datetime object for the start of the event
}

/**
 * Finds the latest "Watch live" or "Upcoming" element within the list.
 * Prioritizes the second "Watch live" element if two are present consecutively.
 * Returns an object containing the type and relevant data (link or time string).
 * For "Upcoming" events, it also calculates the initial time left in milliseconds.
 * @returns {object|null} An object with 'title' and 'link'/'timeString' properties,and optionally 'timeLeftMillis' for 'Upcoming' events,
 * or null if none are found.
 */
function getLatest() {
  const listElement = document.querySelector('.MuiCollapse-wrapperInner .MuiList-root');

  if (listElement) {
    console.log('List element found. Searching for latest item.');
    const listItems = listElement.children;

    for (let i = 0; i < listItems.length; i++) {
      let currentItem = listItems[i];
      const muiBox = currentItem.querySelector('.MuiBox-root');
      const timeStringElement = currentItem.children[2]; // This is where the time string is

      if (muiBox) {
        const itemText = muiBox.textContent.trim();
        if (itemText === 'Watch live') {
          console.log('Found "Watch live" item.');
          // Check if the next item is also "Watch live"
          let nextItem = listItems[i + 1];
          if (nextItem) {
            const nextMuiBox = nextItem.querySelector('.MuiBox-root');
            if (nextMuiBox && nextMuiBox.textContent.trim() === 'Watch live') {
              console.log('Found a second consecutive "Watch live". Returning data for the second one.');
              const buttonBase = nextItem.querySelector('.MuiButtonBase-root');
              return {
                "title": "Watch live",
                "link": buttonBase ? buttonBase.href : null // Get href from the second item
              };
            }
          }
          console.log('Returning data for the first "Watch live" item.');
          const buttonBase = currentItem.querySelector('.MuiButtonBase-root');
          return {
            "title": "Watch live",
            "link": buttonBase ? buttonBase.href : null // Get href from the first item
          };
        } else if (itemText === 'Upcoming') {
          console.log('Found "Upcoming" item. Returning data.');
          const timeLeft = timeStringElement ? convertStringToDate(timeStringElement.textContent) : null;

          return {
            "title": "Upcoming",
            "timeLeft": timeLeft // Return the calculated initial time left (Date object)
          };
        }
      }
    }
    console.log('No "Watch live" or "Upcoming" items found in the list.');
  } else {
    console.log('List element (.MuiCollapse-wrapperInner .MuiList-root) not found.');
  }
  return null; // Return null if the list element or relevant items are not found
}

/**
 * Formats milliseconds into a countdown string (e.g., "02d 10h 30m 15s").
 * @param {number} ms - The time in milliseconds.
 * @returns {string} The formatted countdown string.
 */
function formatCountdown(ms) {
  if (ms < 0) {
    return "Event started!";
  }

  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));

  const pad = (num) => num < 10 ? '0' + num : num;

  return `${pad(days)}d ${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
}

/**
 * Inserts a custom div element into the header of the target card element.
 * The content and styling of the inserted div depend on the result of getLatest().
 * @param {Element} el - The target card element to insert the div into.
 */
async function insertMiddleDiv(el) {
  const cardHeader = el.querySelector('.MuiCardHeader-content');
  console.log('Card header element:', cardHeader);

  // Clear any existing countdown interval before setting up a new one
  if (countdownIntervalId !== null) {
    clearInterval(countdownIntervalId);
    countdownIntervalId = null;
  }

  // Get the latest relevant item (Watch live or Upcoming)
  const latestItem = await getLatest();

  if (cardHeader) {
    // Ensure the header is a flex container to align items
    cardHeader.style.display = 'flex';
    cardHeader.style.alignItems = 'center'; // Vertically align items in the header

    // Create a span to wrap the inner box for spacing and alignment
    const middleDivWrapper = document.createElement('span');
    middleDivWrapper.style.marginLeft = '1rem'; // Add left margin for spacing
    // Use inline-flex on the wrapper to align the inner box vertically within it
    middleDivWrapper.style.display = 'inline-flex';
    middleDivWrapper.style.alignItems = 'center';

    // Create the inner box element
    const innerBox = document.createElement('div');
    innerBox.style.backgroundColor = 'rgb(48 48 48)'; // Default dark grey background
    innerBox.style.color = '#ffffff'; // White text color
    innerBox.style.borderRadius = '4px'; // Rounded corners
    innerBox.style.padding = '4px 8px'; // Padding inside the box
    innerBox.style.height = '2.9vh'; // Fixed height
    innerBox.style.width = 'auto'; // Auto width based on content
    innerBox.style.fontSize = '15px'; // Font size

    // Set content and style based on the latest item found
    if (latestItem === null) {
      console.log('Latest item is null. Setting text to "Weekend over".');
      innerBox.textContent = 'Weekend over';
    } else {
      if (latestItem.title === 'Watch live') {
        console.log('Latest item is "Watch live". Creating link.');
        // Create an anchor tag for the link
        const liveLink = document.createElement('a');
        liveLink.textContent = 'Watch Live';
        liveLink.style.color = 'inherit'; // Inherit text color from parent (innerBox)
        liveLink.style.textDecoration = 'none'; // Remove underline from link

        liveLink.href = latestItem.link; // Set the href of the link
        console.log('Found href for "Watch live":', liveLink.href);

        // Append the link to the inner box
        innerBox.appendChild(liveLink);
        innerBox.style.backgroundColor = 'rgb(225, 6, 0)'; // Red background for live
      } else if (latestItem.title == 'Upcoming') {
        console.log('Latest item is "Upcoming". Setting up countdown.');

        // Function to update the countdown
        const updateCountdown = () => {
          const now = new Date().getTime();
          const distance = latestItem.timeLeft.getTime() - now; // Time left in milliseconds

          if (distance < 0) {
            // Event has started or passed
            innerBox.textContent = "Event started!";
            innerBox.style.backgroundColor = 'rgb(225, 6, 0)'; // Red background for event started
            clearInterval(countdownIntervalId); // Stop the countdown
            countdownIntervalId = null;
            // Optionally, re-run getLatest to see if there's a new "Watch live" or "Upcoming"
            // setTimeout(() => insertMiddleDiv(el), 1000);
          } else {
            innerBox.textContent = 'Next Event In: ' + formatCountdown(distance);
            innerBox.style.backgroundColor = 'rgb(48 48 48)'; // Keep dark grey for upcoming
          }
        };

        // Initial call to display the countdown immediately
        updateCountdown();

        // Update the countdown every second
        countdownIntervalId = setInterval(updateCountdown, 1000);
      }
    }

    // Append the inner box to the wrapper span
    middleDivWrapper.appendChild(innerBox);
    // Append the wrapper span (containing the box) to the header content
    cardHeader.appendChild(middleDivWrapper);
    console.log('Middle div inserted into header.');
  } else {
    console.log('Card header element (.MuiCardHeader-content) not found.');
  }
}