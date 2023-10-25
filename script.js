const threshold = 0.09;
const minPressureDiff = 1;
const timeOffsetHours = 2;
const apiCallIntervalInMinutes = 5;
const mergeThreshold = 1;
const highlightColor = '#e8e074';

// Global variable for table data time format.
// Examples of valid formats:
// "MM-DD-YYYY" for "10-24-2023"
// "DD/MM/YYYY" for "24/10/2023"
// "ddd, MMM Do YYYY" for "Tue, Oct 24th 2023"
// "h:mm A" for "4:15 PM"
// Use any combination or solo. For more formats, refer to moment.js documentation.
const tableDataTimeFormat = "MMM-DD h:mm a";
const currentEventTimeFormat = "MMM-DD h:mm a";

function convertUnixToFormattedTime(unixTime) {
  const date = new Date(unixTime * 1000);
  return moment(date).format('YYYY-MM-DD h:mm A');
}

let tableDataWithEvents = [];

function mergeEvents(events) {
  let merged = [];
  let currentEvent = events[0];

  for (let i = 1; i < events.length; i++) {
    const nextEvent = events[i];
    const timeGap = (new Date(nextEvent.startTime).getTime() - new Date(currentEvent.endTime).getTime()) / (1000 * 60 * 60);

    if (timeGap <= mergeThreshold) {
      currentEvent.endTime = nextEvent.endTime;
      currentEvent.duration = `${parseFloat(currentEvent.duration.split(' ')[0]) + parseFloat(nextEvent.duration.split(' ')[0])} hrs`;
      currentEvent.pressureDiff = parseFloat((currentEvent.pressureDiff + nextEvent.pressureDiff).toFixed(1));
      currentEvent.merged = true;
    } else {
      merged.push(currentEvent);
      currentEvent = nextEvent;
    }
  }
  merged.push(currentEvent);
  return merged;
}

function findPeaksAndTroughs(array) {
  const start = 1;
  const end = array.length - 2;
  const peaks = [];
  const troughs = [];

  for (let i = start; i <= end; i++) {
    const current = array[i];
    const last = array[i - 1];
    const next = array[i + 1];
    const diffNext = Math.abs(current - next);
    const diffLast = Math.abs(current - last);

    if (diffNext >= threshold && diffLast >= threshold) {
      if (current > next && current > last) {
        peaks.push(i);
      } else if (current < next && current < last) {
        troughs.push(i);
      }
    }
  }
  return {
    peaks,
    troughs
  };
}

function calculateTimeToNewEvent(events) {
  const currentTime = new Date();
  currentTime.setHours(currentTime.getHours() + timeOffsetHours); // Ensure time offset is applied
  let nextEventStartTime = null;

  for (let eventData of events) {
    const eventStartTime = new Date(eventData.startTime);
    if (eventStartTime > currentTime) {
      nextEventStartTime = eventStartTime;
      break;
    }
  }

  if (nextEventStartTime) {
    const timeToEventMillis = nextEventStartTime - currentTime;
    const timeToEventHours = Math.floor(timeToEventMillis / (1000 * 60 * 60));
    const timeToEventMinutes = Math.floor((timeToEventMillis % (1000 * 60 * 60)) / (1000 * 60));
    const timeToEventSeconds = Math.floor((timeToEventMillis % (1000 * 60)) / 1000);
    const timeToEventMilliseconds = timeToEventMillis % 1000;

    return `${timeToEventHours} hrs ${timeToEventMinutes} mins ${timeToEventSeconds} sec ${timeToEventMilliseconds} ms`;
  }
  return "No new event.";
}

function updateTableData(data) {
  const tableDataDiv = document.getElementById('tableData');
  let tableContent = '<table class="table table-sm table-striped table-bordered table-hover"><thead><tr><th>Start Time</th><th>End Time</th><th style="text-align: center;"><i class="iconoir-clock"></i></th><th style="text-align: center;"><i class="iconoir-dew-point"></i></th><th style="text-align: center;"><i class="iconoir-vertical-merge"></i></th></tr></thead><tbody>';

  const currentTime = new Date();
  currentTime.setHours(currentTime.getHours() + timeOffsetHours);

  data.forEach(e => {
    const eventStartTime = new Date(e.startTime);
    const eventEndTime = new Date(e.endTime);
    const isCurrentEvent = currentTime >= eventStartTime && currentTime <= eventEndTime;

    tableContent += `<tr style="background-color: ${isCurrentEvent ? highlightColor : 'transparent'}"><td>${moment(eventStartTime).format(tableDataTimeFormat)}</td><td>${moment(eventEndTime).format(tableDataTimeFormat)}</td><td>${e.duration}</td><td>${e.pressureDiff}</td><td>${e.merged ? 'Yes' : 'No'}</td></tr>`;
  });

  tableContent += '</tbody></table>';
  tableDataDiv.innerHTML = tableContent;
}

function logCurrentTime() {
  const now = new Date();
  const offsetMilliseconds = timeOffsetHours * 3600000;
  now.setTime(now.getTime() + offsetMilliseconds);
  const day = now.getDate();
  const month = now.toLocaleString('default', {
    month: 'long'
  });
  const year = now.getFullYear();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const formattedDateTime = `${month} ${day}, ${year} ${hours}:${minutes}:${seconds}`;
  updateCurrentTime(formattedDateTime);
}

function updateCurrentEvent(event) {
  const currentEventDiv = document.getElementById('currentEvent');
  if (event) {
    currentEventDiv.innerHTML = `${moment(new Date(event.startTime)).format(currentEventTimeFormat)} to ${moment(new Date(event.endTime)).format(currentEventTimeFormat)} - ${event.duration} - ${event.pressureDiff} hPa`;

  } else {
    currentEventDiv.innerHTML = "No current event.";
  }
}

function updateTimeToNewEvent() {
  const timeToNewEventDiv = document.getElementById('timeToNewEvent');
  timeToNewEventDiv.innerHTML = calculateTimeToNewEvent(tableDataWithEvents);
}

function updateTimeRemainingInCurrentEvent(currentEvent) {
  const timeRemainingDiv = document.getElementById('timeRemainingInCurrentEvent');

  function updateTimer() {
    const timeRemaining = calculateTimeRemainingInCurrentEvent(currentEvent);
    timeRemainingDiv.innerHTML = timeRemaining;

    if (timeRemaining !== "Event ended." && timeRemaining !== "No current event.") {
      setTimeout(updateTimer, 1);
    }
  }

  updateTimer();
}

function calculateTimeRemainingInCurrentEvent(currentEvent) {
  if (!currentEvent) return "No current event.";

  const currentTime = new Date();
  currentTime.setHours(currentTime.getHours() + timeOffsetHours); // Ensure time offset is applied
  const eventEndTime = new Date(currentEvent.endTime);
  const timeRemainingMillis = eventEndTime - currentTime;

  if (timeRemainingMillis > 0) {
    const timeRemainingHours = Math.floor(timeRemainingMillis / (1000 * 60 * 60));
    const timeRemainingMinutes = Math.floor((timeRemainingMillis % (1000 * 60 * 60)) / (1000 * 60));
    const timeRemainingSeconds = Math.floor((timeRemainingMillis % (1000 * 60)) / 1000);
    const timeRemainingMilliseconds = timeRemainingMillis % 1000;

    return `${timeRemainingHours} hrs ${timeRemainingMinutes} mins ${timeRemainingSeconds} sec ${timeRemainingMilliseconds} ms`;
  }
  return "Event ended.";
}

async function fetchBarometricData() {
  const position = await new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject);
  });
  const {
    latitude,
    longitude
  } = position.coords;

  // Fetch city name using latitude and longitude
  const reverseGeocodeUrl = `https://geocode.maps.co/reverse?lat=${latitude}&lon=${longitude}`;
  const geoResponse = await fetch(reverseGeocodeUrl);
  const geoData = await geoResponse.json();
  const cityName = geoData.address.city;

  // Update HTML to show city name
  const timeSectionHeader = document.getElementById('time-section');
  timeSectionHeader.textContent = `Current Time in ${cityName}:`;

  const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=surface_pressure&timeformat=unixtime&timezone=America%2FNew_York&past_days=1&forecast_days=3`;
  const response = await fetch(apiUrl, {
    cache: 'no-store'
  });
  const data = await response.json();
  return data;
}

async function fetchData() {
  const data = await fetchBarometricData();
  const pressureData = data.hourly.surface_pressure;
  const timeData = data.hourly.time;
  const roundedData = pressureData.map(p => parseFloat(p.toFixed(1)));
  const eventObj = findPeaksAndTroughs(roundedData);
  tableDataWithEvents = [];

  let lastEventPressure = NaN;
  let lastEventTime = NaN;

  timeData.forEach((t, i) => {
    const event = eventObj.peaks.includes(i) ? "Peak" : eventObj.troughs.includes(i) ? "Trough" : "";
    let pressureDiff = isNaN(lastEventPressure) ? NaN : parseFloat(Math.abs(roundedData[i] - lastEventPressure).toFixed(1));
    let startTime = lastEventTime ? convertUnixToFormattedTime(lastEventTime) : "";
    let endTime = convertUnixToFormattedTime(t);
    let duration = lastEventTime ? `${((t - lastEventTime) / 3600).toFixed(1)} hrs` : "";

    if (event) {
      lastEventPressure = roundedData[i];
      lastEventTime = t;
      if (!isNaN(pressureDiff) && pressureDiff >= minPressureDiff) {
        tableDataWithEvents.push({
          startTime,
          endTime,
          duration,
          pressureDiff,
          merged: false
        });
      }
    }
  });

  tableDataWithEvents = mergeEvents(tableDataWithEvents);

  const currentTime = new Date();
  currentTime.setHours(currentTime.getHours() + timeOffsetHours);
  let currentEvent = null;
  for (let eventData of tableDataWithEvents) {
    const eventStartTime = new Date(eventData.startTime);
    const eventEndTime = new Date(eventData.endTime);
    if (currentTime >= eventStartTime && currentTime <= eventEndTime) {
      currentEvent = eventData;
      break;
    }
  }

  const timeToNewEvent = calculateTimeToNewEvent(tableDataWithEvents);
  const timeRemainingInCurrentEvent = calculateTimeRemainingInCurrentEvent(currentEvent);

  tableDataWithEvents.forEach(eventData => {
    const eventItem = document.createElement("li");
    eventItem.classList.add("list-group-item");
    const headerLink = document.createElement("a");
    headerLink.setAttribute("data-toggle", "collapse");
    headerLink.setAttribute("href", `#event${eventData.startTime}`);
    headerLink.textContent = `${eventData.startTime} to ${eventData.endTime}`;
    const collapseDiv = document.createElement("div");
    collapseDiv.classList.add("collapse");
    collapseDiv.setAttribute("id", `event${eventData.startTime}`);
    const cardDiv = document.createElement("div");
    cardDiv.classList.add("card", "card-body");
    cardDiv.innerHTML = `
            Duration: ${eventData.duration}<br>
            Pressure Difference: ${eventData.pressureDiff} hPa<br>
        `;

    if (eventData.merged) {
      const badge = document.createElement("span");
      badge.classList.add("badge", "badge-warning");
      badge.textContent = "Merged";
      cardDiv.appendChild(badge);
    }

    collapseDiv.appendChild(cardDiv);
    eventItem.appendChild(headerLink);
    eventItem.appendChild(collapseDiv);
    // eventList.appendChild(eventItem);
  });

  updateTableData(tableDataWithEvents);
  updateCurrentTime(currentTime.toTimeString().substring(0, 5));
  updateCurrentEvent(currentEvent);
  updateTimeToNewEvent(calculateTimeToNewEvent(tableDataWithEvents));
  updateTimeRemainingInCurrentEvent(calculateTimeRemainingInCurrentEvent(currentEvent));
  updateTimeRemainingInCurrentEvent(currentEvent);
}

function updateCurrentTime(time) {
  const currentTimeDiv = document.getElementById('currentTime');
  currentTimeDiv.innerHTML = time;
}

fetchData();
setInterval(fetchData, apiCallIntervalInMinutes * 60 * 1000);
setInterval(logCurrentTime, 1000);
// Update the interval to refresh every millisecond for higher accuracy
setInterval(updateTimeToNewEvent, 1);
