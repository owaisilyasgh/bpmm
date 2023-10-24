# Atmospheric Pressure Tracker

This project fetches atmospheric pressure data and identifies significant pressure events based on the data. It fetches data from an API, identifies peaks and troughs, calculates durations, identifies ongoing events, and updates time at regular intervals.

## Functions

### `convertUnixToFormattedTime(unixTime)`

#### Purpose
Converts Unix timestamp to a readable date and time string.

#### Behavior
- Takes a Unix timestamp as input.
- Creates a JavaScript Date object from it.
- Extracts hours and minutes, zero-padding them if they are single-digit.
- Returns a string that combines the date and time.

---

### `findPeaksAndTroughs(array)`

#### Purpose
Identifies significant peaks and troughs in an array of pressure data.

#### Behavior
- Takes an array of pressure data as input.
- Iterates through the array, ignoring the first and last elements.
- Compares each element to its adjacent elements to find peaks and troughs based on a threshold.
- Returns an object containing arrays of indices for the identified peaks and troughs.

---

### `fetchData()`

#### Purpose
Fetches atmospheric pressure data from an API and identifies significant events.

#### Behavior
- Fetches data from a predefined API URL.
- Parses the JSON response to obtain the pressure data and time data.
- Calls `findPeaksAndTroughs()` to find significant events.
- Iterates over the time data and identifies the start time, end time, duration, and pressure difference for each event.
- Stores this information in `tableDataWithEvents`.
- Identifies the current ongoing event based on the system time.
- Logs the significant events, current time, and current event to the console.

---

### `updateCurrentTime()`

#### Purpose
Updates the current time displayed on the interface.

#### Behavior
- Retrieves the current system time.
- Formats it into a readable string.
- Updates the interface with the new time string.

---

### `setInterval()`

#### Purpose
Sets an interval to refresh data and time.

#### Behavior
- Takes two arguments: a function to execute and the time interval for execution in milliseconds.
- Executes the function at the specified intervals.

---

### `calculateTimeLeftInEvent(currentEvent)`

#### Purpose
Calculates the time left in the current atmospheric pressure event.

#### Behavior
- Takes the current event object as an argument, which contains the start and end times.
- Retrieves the current system time.
- Subtracts the current time from the end time of the event.
- Formats the time left into a readable string.
- Logs the time left in the current event to the console.

---


For each function, you'd initialize necessary variables, iterate through data sets as required, perform calculations or transformations, and return or store the relevant outputs. If you need to recreate any of these functions, you'd follow these outlined steps while adapting as needed for your specific requirements.
