// main.js
// Add your JavaScript code here
console.log('Page loaded.');



function getLatestNearestAsteroid() {
    const apiKey = 'DEMO_KEY';
    const today = new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'
    const url = `https://api.nasa.gov/neo/rest/v1/feed?start_date=${today}&end_date=${today}&api_key=${apiKey}`;

    return fetch(url)
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(data => {
            const neos = data.near_earth_objects[today];
            if (!neos || neos.length === 0) throw new Error('No asteroids found for today');
            // Find the nearest asteroid (smallest miss_distance in kilometers)
            let nearest = neos[0];
            let minDistance = parseFloat(nearest.close_approach_data[0].miss_distance.kilometers);
            for (const neo of neos) {
                const dist = parseFloat(neo.close_approach_data[0].miss_distance.kilometers);
                if (dist < minDistance) {
                    minDistance = dist;
                    nearest = neo;
                }
            }
            const name = nearest.name;
            const diameter = nearest.estimated_diameter.kilometers;
            return {
                "name":name,
                "date": today,
                "why": "This is the nearest asteroid to Earth today.",
                "data": nearest,
                "min_diameter_km": diameter.estimated_diameter_min,
                "max_diameter_km": diameter.estimated_diameter_max,
            };
        });
}

// Helper to parse CSV
function parseCSV(csv) {
    const lines = csv.trim().split('\n');
    const headers = lines[0].split(',');
    return lines.slice(1).map(line => {
        const values = line.split(',');
        const obj = {};
        headers.forEach((h, i) => obj[h.trim()] = values[i] ? values[i].trim() : '');
        return obj;
    });
}

// Load things.csv and populate dropdown
function loadThingsAndPopulateDropdown(asteroidData, closestThingResultDiv){
    fetch('data/things.csv')
        .then(res => res.text())
        .then(csv => {
            const things = parseCSV(csv);
            // Sort things by height (ascending)
            things.sort((a, b) => parseFloat(a.height) - parseFloat(b.height));
            thingsList = things;
            const select = document.getElementById('thing-select');
            select.innerHTML = '<option value="">Select a thing...</option>';
            things.forEach((thing, idx) => {
                const opt = document.createElement('option');
                opt.value = idx;
                opt.textContent = thing.name;
                select.appendChild(opt);
            });
            select.things = things; // attach for later use
            afterThingsLoaded(asteroidData, thingsList, closestThingResultDiv);
        });
}

// Compare asteroid to selected thing
function compareAsteroidToThing(asteroid, thing) {
    const asteroidSize = asteroid.max_diameter_km * 1000; // convert km to meters
    const thingHeight = parseFloat(thing.height);
    if (!thingHeight || thingHeight <= 0) return 'Invalid thing height.';
    const numThings = asteroidSize / thingHeight;
    return `The asteroid's max diameter is as tall as <strong>${numThings.toFixed(1)}</strong> ${thing.name} stacked on one another.`;
}

// Find the thing closest in size to the asteroid (by average diameter vs. height)
function findClosestThingToAsteroid(asteroid, things) {
    const asteroidAvgDiameter = ((asteroid.max_diameter_km + asteroid.min_diameter_km) / 2) * 1000; // meters
    const asteroidMaxDiameter = asteroid.max_diameter_km * 1000; // meters
    let closest = null;
    let minDiff = Infinity;
    things.forEach(thing => {
        const thingHeight = parseFloat(thing.height);
        if (!thingHeight || thingHeight <= 0) return;
        const diff = Math.abs(asteroidMaxDiameter - thingHeight);
        if (diff < minDiff) {
            minDiff = diff;
            closest = thing;
        }
    });
    if (!closest) return null;
    const percent = (closest.height / asteroidMaxDiameter) * 100;
    return {
        thing: closest,
        percent: percent
    };
}


function showClosestThing(asteroid, things, closestThingResultDiv) {
        const closest = findClosestThingToAsteroid(asteroid, things, closestThingResultDiv);
        const div = closestThingResultDiv;
        console.log("closestThingResultDiv:", closestThingResultDiv);
        div.className = 'closest-thing';
        console.log('Closest thing found:', closest);
        if (closest) {
            div.innerHTML = `The closest thing to the size of the asteroid in your database is <strong>${closest.thing.name}</strong>, which is <strong>${closest.percent.toFixed(1)}%</strong> taller. (comparing height vs. average diameter).`;
        } else {
            div.innerHTML = 'No valid comparison found.';
        }
        output.appendChild(div);
    }

function afterThingsLoaded(asteroidData, thingsList, closestThingResultDiv) {
        if (asteroidData) {
            showClosestThing(asteroidData, thingsList, closestThingResultDiv);
        }
        else{
            console.warn('Asteroid data not loaded yet, cannot show closest thing.');
            closestThingResultDiv.innerHTML = '<em>Asteroid data not loaded yet.</em>';
        }
    }

window.addEventListener('DOMContentLoaded', () => {
    const output = document.getElementById('asteroid-output');
    const select = document.getElementById('thing-select');
    const comparisonDiv = document.getElementById('comparison-result');
    const closestThingResultDiv = document.getElementById('closest-thing-result');
    let asteroidData = null;
    let thingsList = [];

    getLatestNearestAsteroid()
        .then(result => {
            asteroidData = result;
            loadThingsAndPopulateDropdown(asteroidData, closestThingResultDiv);
            output.innerHTML = `
                <div class="asteroid-info">
                    <h2>Nearest Asteroid Today</h2>
                    <p><strong>Name:</strong> ${result.name}</p>
                    <p><strong>Date:</strong> ${result.date}</p>
                    <p><strong>Why:</strong> ${result.why}</p>
                    <p><strong>Min Diameter (km):</strong> ${result.min_diameter_km.toFixed(3)}</p>
                    <p><strong>Max Diameter (km):</strong> ${result.max_diameter_km.toFixed(3)}</p>
                </div>
            `;
            
        })
        .catch(err => {
            output.innerHTML = `<p style="color:red;">Error: ${err.message}</p>`;
        });

    // If thingsList is loaded, show closest thing
            if (thingsList.length > 0) {
                showClosestThing(asteroidData, thingsList, closestThingResultDiv);
            }

    select.addEventListener('change', function() {
        if (!asteroidData) {
            comparisonDiv.innerHTML = '<em>Asteroid data not loaded yet.</em>';
            return;
        }
        const idx = this.value;
        if (!idx) {
            comparisonDiv.innerHTML = '';
            return;
        }
        const thing = select.things[idx];
        comparisonDiv.innerHTML = compareAsteroidToThing(asteroidData, thing);
    });
});