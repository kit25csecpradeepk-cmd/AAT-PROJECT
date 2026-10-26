
const STORAGE_KEY = "smartHomeReadings";

const temperatureEl = document.getElementById("temperature");
const humidityEl = document.getElementById("humidity");
const powerEl = document.getElementById("power");
const predictionEl = document.getElementById("prediction");
const alertsEl = document.getElementById("alerts");
const historyBody = document.getElementById("historyBody");
const storageStatus = document.getElementById("storageStatus");

const addReadingBtn = document.getElementById("addReadingBtn");
const clearHistoryBtn = document.getElementById("clearHistoryBtn");

let readings = loadReadings();

function loadReadings() {
    try {
        const savedData = localStorage.getItem(STORAGE_KEY);

        if (!savedData) {
            return [];
        }

        const parsedData = JSON.parse(savedData);

        if (
            !Array.isArray(parsedData) ||
            !parsedData.every(item =>
                item &&
                Number.isFinite(item.temperature) &&
                Number.isFinite(item.humidity) &&
                Number.isFinite(item.power) &&
                Number.isFinite(item.timestamp)
            )
        ) {
            return [];
        }

        return parsedData.slice(0, 50);
    } catch (error) {
        console.error("Unable to load saved readings:", error);
        return [];
    }
}

function saveReadings() {
    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(readings)
        );

        storageStatus.textContent = "Data saved locally";
        return true;
    } catch (error) {
        console.error("Unable to save readings:", error);

        storageStatus.textContent = "Storage unavailable";
        return false;
    }
}

function generateReading(timestamp = Date.now()) {
    return {
        temperature: Math.floor(Math.random() * 16) + 24,
        humidity: Math.floor(Math.random() * 41) + 40,
        power: Math.floor(Math.random() * 2201) + 300,
        timestamp: timestamp
    };
}

function addReading() {
    const newReading = generateReading();

    readings.unshift(newReading);
    readings = readings.slice(0, 50);

    saveReadings();
    renderDashboard();
}

function predictDailyEnergy() {
    if (readings.length === 0) {
        return null;
    }

    // Estimate average power using the latest five readings.
    const recentReadings = readings.slice(0, 5);

    const averagePower =
        recentReadings.reduce(
            (total, item) => total + item.power,
            0
        ) / recentReadings.length;

    // Assumes this average power continues for 24 hours.
    return (averagePower * 24) / 1000;
}

function renderAlerts(reading) {
    const messages = [];

    if (reading.temperature > 35) {
        messages.push(
            "Warning: High room temperature detected!"
        );
    }

    if (reading.power > 2000) {
        messages.push(
            "Warning: High power usage detected!"
        );
    }

    if (messages.length === 0) {
        alertsEl.textContent = "All readings are within demo thresholds.";
        alertsEl.className = "alerts";
    } else {
        alertsEl.textContent = messages.join("\n");
        alertsEl.className = "alerts warning";
    }
}

function renderHistory() {
    historyBody.replaceChildren();

    if (readings.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = 4;
        cell.textContent = "No readings available. Add a new reading.";

        row.appendChild(cell);
        historyBody.appendChild(row);
        return;
    }

    readings.forEach(item => {
        const row = document.createElement("tr");

        const values = [
            new Date(item.timestamp).toLocaleString(),
            `${item.temperature} °C`,
            `${item.humidity} %`,
            `${item.power} W`
        ];

        values.forEach(value => {
            const cell = document.createElement("td");
            cell.textContent = value;
            row.appendChild(cell);
        });

        historyBody.appendChild(row);
    });
}

function renderDashboard() {
    const latest = readings[0];

    if (!latest) {
        temperatureEl.textContent = "--";
        humidityEl.textContent = "--";
        powerEl.textContent = "--";
        predictionEl.textContent = "--";

        alertsEl.textContent = "No readings available.";
        alertsEl.className = "alerts";

        renderHistory();
        return;
    }

    temperatureEl.textContent = latest.temperature;
    humidityEl.textContent = latest.humidity;
    powerEl.textContent = latest.power;

    const prediction = predictDailyEnergy();

    predictionEl.textContent = prediction.toFixed(2);

    renderAlerts(latest);
    renderHistory();
}

addReadingBtn.addEventListener("click", addReading);

clearHistoryBtn.addEventListener("click", () => {
    const confirmed = confirm(
        "Are you sure you want to clear all saved readings?"
    );

    if (!confirmed) {
        return;
    }

    readings = [];
    saveReadings();
    renderDashboard();
});

// Generate demo readings only on the first visit.
if (readings.length === 0) {
    readings = Array.from(
        { length: 5 },
        (_, index) => generateReading(
            Date.now() - index * 60 * 60 * 1000
        )
    );

    saveReadings();
}

renderDashboard();
