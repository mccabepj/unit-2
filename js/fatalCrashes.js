
document.addEventListener('DOMContentLoaded', function() {
    setupFatalCrashMap();
    fetchCrashData('data/FARS_CBSA.geojson')
        .then(data => {
            populateYearDropdown(data);  // Initialize year dropdown with 2012 selected by default
            const selectedYear = "Total_2012";  // Specify the default year for map initialization
            updateMap(data.features, selectedYear);  // Initialize map with 2012 data
            updateChart(data); // Initialize chart, if needed
        })
        .catch(console.error);
});

// Script or module for map and chart logic

// Define an array of predefined colors
const colors = [
    '#FF6384',  // pink
    '#36A2EB',  // blue
    '#FFCE56',  // yellow
    '#4BC0C0',  // teal
    '#9966FF',  // purple
    '#FF9F40'   // orange
    // Add more colors as needed
];
let fatalCrashMap;
let fatalCrashLayerGroup;
let chartFatalMSA;
let selectedMSAs = [];  // Array to hold the selected MSA data


function setupFatalCrashMap() {
    if (!fatalCrashMap) {
        fatalCrashMap = L.map('fatalCrashMap').setView([37.8, -96], 4);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '© OpenStreetMap contributors | CARTO',
            subdomains: 'abcd',
            maxZoom: 19
        }).addTo(fatalCrashMap);
        fatalCrashLayerGroup = L.layerGroup().addTo(fatalCrashMap);
        fatalCrashMap.on('click', handleMSAClick); // Add click event listener to the map
    }
}

function handleMSAClick(e) {
    const feature = e.target.feature;  // Assuming feature is directly available on e.target, make sure this is correct

    if (!feature) {
        console.error("No feature data available on the clicked element.");
        return;
    }

    const msaName = feature.properties['Metro Area'];
    const index = selectedMSAs.findIndex(m => m.properties['Metro Area'] === msaName);

    if (e.originalEvent.ctrlKey || e.originalEvent.metaKey) {
        // Ctrl or Cmd key pressed, toggle selection
        if (index === -1) {
            selectedMSAs.push(feature);
            console.log("Added MSA to selection:", msaName);
        } else {
            selectedMSAs.splice(index, 1);
            console.log("Removed MSA from selection:", msaName);
        }
    } else {
        // No keys pressed, single selection
        if (selectedMSAs.length === 1 && index !== -1) {
            // Clicking the already selected MSA, deselect it
            selectedMSAs = [];
            console.log("Deselected MSA:", msaName);
        } else {
            // Select only this MSA
            selectedMSAs = [feature];
            console.log("Selected MSA:", msaName);
        }
    }

    // Update chart with the new selection of MSAs
    updateChartWithSelectedMSAs();
}



function updateChartWithSelectedMSAs() {
    const ctx = document.getElementById('chartFatalMSA').getContext('2d');
    if (window.chartFatalMSA instanceof Chart) {
        window.chartFatalMSA.destroy();
    }

    const datasets = selectedMSAs.map((feature, index) => {
        const properties = feature.properties;
        const years = Object.keys(properties).filter(key => key.startsWith('Total_'));
        const crashData = years.map(year => properties[year]);

        return {
            label: properties['Metro Area'],  // Just the metro area name for the legend
            data: crashData,
            borderColor: colors[index % colors.length],
            fill: false
        };
    });

    window.chartFatalMSA = new Chart(ctx, {
        type: 'line',
        data: {
            // Strip 'Total_' from the year labels to only show the year part
            labels: Object.keys(selectedMSAs[0].properties).filter(key => key.startsWith('Total_')).map(year => year.slice(6)),
            datasets: datasets
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            tooltips: {
                enabled: true,
                mode: 'index',
                intersect: false,
                callbacks: {
                    label: function(tooltipItem, data) {
                        return tooltipItem.yLabel;
                    }
                }
            },
            plugins: {
                legend: {
                    display: true  // Ensure legends are shown; adjust as needed
                },
                tooltip: {
                    callbacks: {
                        // Simplified tooltip that only shows the value
                        label: function(context) {
                            return context.raw;
                        }
                    }
                }
            }
        }
    });

    console.log("Chart updated successfully with multiple MSAs!");
}

function fetchCrashData(url) {
    return fetch(url)
        .then(response => response.json())
        .catch(error => {
            console.error('Error loading crash data:', error);
            throw error;
        });
}

function populateYearDropdown(data) {
    let years = new Set();
    data.features.forEach(feature => {
        Object.keys(feature.properties).forEach(key => {
            if (key.startsWith("Total_")) {
                years.add(key.substring(6));
            }
        });
    });

    const yearDropdown = document.getElementById('yearDropdown');
    yearDropdown.innerHTML = '';
    const defaultOption = document.createElement('option');
    defaultOption.textContent = "Select Year";
    yearDropdown.appendChild(defaultOption);

    [...years].sort().forEach(year => {
        const option = document.createElement('option');
        option.value = "Total_" + year;
        option.textContent = year;
        if (year === "2012") {
            option.selected = true;  // Set 2012 as the default selected option
        }
        yearDropdown.appendChild(option);
    });
    yearDropdown.addEventListener('change', () => {
        const selectedYear = yearDropdown.value;
        updateMap(data.features, selectedYear);
    });
}

function updateMap(features, selectedYear) {
    fatalCrashLayerGroup.clearLayers();
    L.geoJSON(features, {
        pointToLayer: (feature, latlng) => {
            const value = feature.properties[selectedYear] || "N/A";
            // Extract the year from the selectedYear string
            const year = selectedYear.substring(6); // Remove "Total_" prefix which is 6 characters long

            // Check and remove 'Metro Area' from the area name if it ends with 'Metro Area'
            let areaName = feature.properties['Metro Area'];
            if (areaName.endsWith('Metro Area')) {
                areaName = areaName.replace(' Metro Area', '');  // Removes ' Metro Area' from the end of the string
            }

            const marker = L.circleMarker(latlng, {
                radius: calculateFlanneryRadius(value),
                fillColor: "#ff7800",
                color: "#000",
                weight: .4,
                opacity: .8,
                fillOpacity: 0.8
            }).bindPopup(`<strong>Metro Area:</strong> ${areaName}<br><strong>${year} Fatal Crash Total:</strong> ${value}`);

            marker.on('click', handleMSAClick);  // Attach click event here
            return marker;
        }
    }).addTo(fatalCrashLayerGroup);
}




function calculateFlanneryRadius(value) {
    const flanneryAdjustment = 0.57;
    return Math.pow(value * flanneryAdjustment, 0.5715);
}

function updateChart(data) {
    // Check if chartFatalMSA is already instantiated
    if (window.chartFatalMSA instanceof Chart) {
        // Destroy the existing chart
        window.chartFatalMSA.destroy();
    }

    // Extract the years and MSAs from the data
    const years = Object.keys(data.features[0].properties).filter(prop => prop.startsWith('Total_'));
    const MSAs = data.features.map(feature => feature.properties['Metro Area']);

    // Select a random MSA
    const randomMSA = MSAs[Math.floor(Math.random() * MSAs.length)];

    // Get the crash data for the selected MSA
    const crashData = years.map(year => parseInt(data.features.find(feature => feature.properties['Metro Area'] === randomMSA).properties[year]));

    console.log("Random MSA:", randomMSA);
    console.log("Crash Data:", crashData);

    // Get the canvas element
    const ctx = document.getElementById('chartFatalMSA').getContext('2d');

    // Create the chart and store it in window.chartFatalMSA
    window.chartFatalMSA = new Chart(ctx, {
        type: 'line',  // Changed from 'bar' to 'line'
        data: {
            labels: years,
            datasets: [{
                label: `Fatal Crashes in ${randomMSA}`,
                data: crashData,
                backgroundColor: 'rgba(255, 99, 132, 0.2)', // Consider changing if area look is not desired
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1,
                fill: false // Set to true for area chart look, false for plain line chart
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    console.log("Chart created successfully!");
}



