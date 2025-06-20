// main.js
// Add your JavaScript code here
console.log('Page loaded.');



function getLatestNearestAsteroid() {
    const apiKey = 'FajSctVLEY7pOpae3fS5Fds50yJM49OyJEsRspZ9'; // No powers BUT READ, replace with your own.
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
            const miss_distance_km = nearest.close_approach_data[0].miss_distance.kilometers;
            
            return {
                "name":name,
                "date": today,
                "why": "This is the nearest asteroid to Earth today.",
                "data": nearest,
                "min_diameter_km": diameter.estimated_diameter_min,
                "max_diameter_km": diameter.estimated_diameter_max,
                "miss_distance_km": miss_distance_km
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
            console.log('Parsed things from CSV:', things); // Debug: show all parsed things
            // Sort things by height (ascending)
            things.sort((a, b) => parseFloat(a.height) - parseFloat(b.height));
            thingsList = things;
            const select = document.getElementById('thing-select');
            select.innerHTML = '<option value="">Select a thing...</option>';
            things.forEach((thing, idx) => {
                console.log(`Adding thing to dropdown: ${thing.name}, height: ${thing.height}, width: ${thing.width}, length: ${thing.length}`); // Debug: show each thing being added
                const opt = document.createElement('option');
                opt.value = idx;
                opt.textContent = thing.name;
                select.appendChild(opt);
            });
            select.things = things; // attach for later use
            afterThingsLoaded(asteroidData, thingsList, closestThingResultDiv);
        });
}

// Compare asteroid to selected thing by chosen dimension
function compareAsteroidToThing(asteroid, thing, dimension = 'height') {
    const asteroidSize = asteroid.max_diameter_km * 1000; // meters
    let thingValue = parseFloat(thing[dimension]);
    let dimensionLabel = dimension.charAt(0).toUpperCase() + dimension.slice(1);

    let maxValueType = "none"
    if (dimension === 'max') {
        thingValue = Math.max(parseFloat(thing.height), parseFloat(thing.width), parseFloat(thing.length));
        maxValueType = (thingValue === parseFloat(thing.height)) ? 'height' : (thingValue === parseFloat(thing.width)) ? 'width' : 'length';
        dimensionLabel = 'Max Dimension';
    } else if (dimension === 'volume') {
        // Ellipsoid volume: 4/3 * pi * a * b * c
        const pi = Math.PI;
        // For thing: a,b,c = height, width, length
        const a = parseFloat(thing.height) / 2;
        const b = parseFloat(thing.width) / 2;
        const c = parseFloat(thing.length) / 2;
        const thingVolume = (4/3) * pi * a * b * c;
        // For asteroid: a = max_diameter/2, b = min_diameter/2, c = min_diameter/2
        const asteroidA = (asteroid.max_diameter_km * 1000) / 2;
        const asteroidB = (asteroid.min_diameter_km * 1000) / 2;
        const asteroidC = (asteroid.min_diameter_km * 1000) / 2;
        const asteroidVolume = (4/3) * pi * asteroidA * asteroidB * asteroidC;
        console.log(`Asteroid volume: ${asteroidVolume}, Thing volume: ${thingVolume}, Asteroid a,b,c: ${asteroidA},${asteroidB},${asteroidC}, Thing a,b,c: ${a},${b},${c}`);
        if (!thingVolume || thingVolume <= 0) return 'Invalid thing volume.';
        const numThings = asteroidVolume / thingVolume;
        return `The asteroid's volume is as large as <strong>${numThings.toFixed(2)}</strong> ${thing.name} by volume (if both the asteroid and the ${thing.name} are shaped like ellipsoids).`;
    }

    if (!thingValue || thingValue <= 0) return 'Invalid thing dimension.';
    const numThings = asteroidSize / thingValue;
    console.log(`Asteroid size: ${asteroidSize}, Thing value (${dimensionLabel}): ${thingValue}, Num things: ${numThings}`);
    //
    let newDimensionLabel = (dimensionLabel === 'Max Dimension') ? "Max Dimension: "+maxValueType :  dimensionLabel;
    //
    return `The asteroid's max diameter is as large as <strong>${numThings.toFixed(2)}</strong> ${thing.name} stacked end-to-end by (${newDimensionLabel.toLowerCase()}).`;
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
            div.innerHTML = `The closest thing to the size of the asteroid in our database is <strong>${closest.thing.name}</strong>, which is as big as <strong>${closest.percent.toFixed(1)}%</strong> the asteroid. (comparing <strong>${closest.thing.name}</strong> height vs. asteroid max diameter).`;
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

function getAsteroidById(asteroidId) {
    const apiKey = 'DEMO_KEY';
    const url = `https://api.nasa.gov/neo/rest/v1/neo/${asteroidId}?api_key=${apiKey}`;
    return fetch(url)
        .then(response => {
            if (!response.ok) throw new Error('Asteroid not found or network error');
            return response.json();
        })
        .then(data => {
            // The structure is different from the feed endpoint
            const diameter = data.estimated_diameter.kilometers;
            return {
                name: data.name,
                id: data.id,
                date: data.close_approach_data && data.close_approach_data[0] ? data.close_approach_data[0].close_approach_date : 'N/A',
                why: 'This is the specific asteroid you requested.',
                data: data,
                min_diameter_km: diameter.estimated_diameter_min,
                max_diameter_km: diameter.estimated_diameter_max,
            };
        });
}

window.addEventListener('DOMContentLoaded', () => {
    const output = document.getElementById('asteroid-output');
    const select = document.getElementById('thing-select');
    const comparisonDiv = document.getElementById('comparison-result');
    const closestThingResultDiv = document.getElementById('closest-thing-result');
    const showTodayBtn = document.getElementById('show-today-btn');
    const showSpecificBtn = document.getElementById('show-specific-btn');
    const asteroidIdForm = document.getElementById('asteroid-id-form');
    const asteroidIdInput = document.getElementById('asteroid-id-input');
    // Add dimension select dropdown
    const dimensionSelect = document.getElementById('dimension-select');
    let asteroidData = null;
    let thingsList = [];
    let mode = 'today'; // 'today' or 'specific'

    function setMode(newMode) {
        mode = newMode;
        if (mode === 'today') {
            showTodayBtn.classList.add('active');
            showSpecificBtn.classList.remove('active');
            asteroidIdForm.style.display = 'none';
            // Reload nearest asteroid
            getLatestNearestAsteroid()
                .then(result => {
                    asteroidData = result;
                    console.log('asteroidData:', asteroidData);
                    loadThingsAndPopulateDropdown(asteroidData, closestThingResultDiv);
                    output.innerHTML = `
                        <div class="asteroid-info">
                            <h2>Nearest Asteroid Today</h2>
                            <p><strong>Name:</strong> ${result.name}</p>
                            <p><strong>ID:</strong> ${result.id}</p>
                            <p><strong>Date:</strong> ${result.date}</p>
                            <p><strong>Why:</strong> ${result.why}</p>
                            <p><strong>Min Diameter (km):</strong> ${parseFloat(result.min_diameter_km).toFixed(3)} km (${(parseFloat(result.min_diameter_km) * 1000).toFixed(0)} m)</p>
                            <p><strong>Max Diameter (km):</strong> ${parseFloat(result.max_diameter_km).toFixed(3)} km (${(parseFloat(result.max_diameter_km) * 1000).toFixed(0)} m)</p>
                            <p><strong>Miss Distance (km):</strong> ${parseFloat(result.miss_distance_km).toFixed(3)} km</p>
                        </div>
                    `;
                })
                .catch(err => {
                    output.innerHTML = `<p style="color:red;">Error: ${err.message}</p>`;
                });
        } else {
            showTodayBtn.classList.remove('active');
            showSpecificBtn.classList.add('active');
            asteroidIdForm.style.display = 'flex';
            output.innerHTML = '';
            closestThingResultDiv.innerHTML = '';
            comparisonDiv.innerHTML = '';
        }
    }

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
                    <p><strong>Min Diameter (km):</strong> ${result.min_diameter_km.toFixed(3)} km (${(result.min_diameter_km * 1000).toFixed(0)} m)</p>
                    <p><strong>Max Diameter (km):</strong> ${result.max_diameter_km.toFixed(3)} km (${(result.max_diameter_km * 1000).toFixed(0)} m)</p>
                    <p><strong>Miss Distance (km):</strong> ${Math.round(Number(result.miss_distance_km))} km</p>
                    <p><strong>Link to more information</strong>: <a href="https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html#/?sstr=${result.data.id}" target="_blank">Jet Propulsion Laboratory's Small-Body Database</a></p>
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

    // Update comparison when either dropdown changes
    function updateComparison() {
        if (!asteroidData) {
            comparisonDiv.innerHTML = '<em>Asteroid data not loaded yet.</em>';
            return;
        }
        const idx = select.value;
        if (!idx) {
            comparisonDiv.innerHTML = '';
            return;
        }
        const thing = select.things[idx];
        const dimension = dimensionSelect.value;
        comparisonDiv.innerHTML = compareAsteroidToThing(asteroidData, thing, dimension);
    }

    select.addEventListener('change', updateComparison);
    dimensionSelect.addEventListener('change', updateComparison);

    showTodayBtn.addEventListener('click', () => setMode('today'));
    showSpecificBtn.addEventListener('click', () => setMode('specific'));

    asteroidIdForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const id = asteroidIdInput.value.trim();
        if (!id) {
            output.innerHTML = '<p style="color:red;">Please enter a valid Asteroid ID.</p>';
            return;
        }
        getAsteroidById(id)
            .then(result => {
                asteroidData = result;
                loadThingsAndPopulateDropdown(asteroidData, closestThingResultDiv);
                output.innerHTML = `
                    <div class="asteroid-info">
                        <h2>Asteroid: ${result.name}</h2>
                        <p><strong>Date:</strong> ${result.date}</p>
                        <p><strong>Why:</strong> ${result.why}</p>
                        <p><strong>Min Diameter (km):</strong> ${result.min_diameter_km.toFixed(3)} km (${(result.min_diameter_km * 1000).toFixed(0)} m)</p>
                        <p><strong>Max Diameter (km):</strong> ${result.max_diameter_km.toFixed(3)} km (${(result.max_diameter_km * 1000).toFixed(0)} m)</p>
                    </div>
                `;
            })
            .catch(err => {
                output.innerHTML = `<p style=\"color:red;\">Asteroid not found. Please check the ID and try again. If the problem persists, the NASA API may be temporarily unavailable or you may have exceeded the rate limit. <br>Error details: ${err.message}</p>`;
                closestThingResultDiv.innerHTML = '';
                comparisonDiv.innerHTML = '';
            });
    });
});