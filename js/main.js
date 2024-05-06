// Global variables for the maps
var fatalCrashMap, systemicInitiativesMap;
var fatalCrashLayerGroup = L.layerGroup();
var systemicInitiativesLayerGroup = L.layerGroup();

console.log("JavaScript code started loading...");

// Function to create and show the Fatal Crash map
function createFatalCrashMap() {
    // Create the Fatal Crash map centered at a specific location and with an initial zoom level
    fatalCrashMap = L.map('fatalCrashMap').setView([37.8, -96], 4);

    // Add a base map 
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap contributors | CARTO',
        subdomains: 'abcd',
        minZoom: 2,
        maxZoom: 19
    }).addTo(fatalCrashMap);

    // Call the function to get and display Fatal Crash data on the map
    getFatalCrashData();
}

// Call the function to get Fatal Crash data and populate the year dropdown
function getFatalCrashData() {
    // Fetch GeoJSON data for Fatal Crashes
    fetch("data/FARS_CBSA.geojson")
        .then(function (response) {
            return response.json();
        })
        .then(function (data) {
            // Populate the year dropdown with available options
            populateYearDropdown(data.features);

            // Trigger the onYearChange function to update the map based on the initially selected year
            onYearChange();

            // Display Fatal Crash points on the map
            displayFatalCrashPoints(data);
        })
        .catch(function (error) {
            console.error("Error loading Fatal Crash GeoJSON data:", error);
        });
}

// Function to display Fatal Crash points on the map
function displayFatalCrashPoints(data) {
    // Get the selected year from the dropdown
    var selectedYear = document.getElementById('yearDropdown').value;

    // Get the maximum total value among all years
    var maxTotal = getMaxTotal(data.features, selectedYear);

    L.geoJson(data, {
        pointToLayer: function (feature, latlng) {
            // Get the total value for the selected year
            var totalValue = parseInt(feature.properties[selectedYear]);

            // Calculate the radius using the Flannery method
            var radius = calculateFlanneryRadius(totalValue, maxTotal);

            // Customize marker options for Fatal Crash points
            var markerOptions = {
                radius: radius,
                fillColor: "#2e251f", // black color for Fatal Crashes
                color: "#000",
                weight: .4,
                opacity: .5,
                fillOpacity: 0.4
            };

            // Create a marker with popup content
            var yearWithoutPrefix = selectedYear.substring(6);
            var popupContent = "<p><b>Metro Area:</b> " + feature.properties["Metro_Area"] + "</p>";
            popupContent += "<p><b>Fatal Crashes, " + yearWithoutPrefix + ":</b> " + totalValue + "</p>";

            var marker = L.circleMarker(latlng, markerOptions).bindPopup(popupContent);
            return marker;
        }
    }).addTo(fatalCrashLayerGroup);

    // Add the Fatal Crash layer group to the map
    fatalCrashLayerGroup.addTo(fatalCrashMap);

    console.log("Fatal Crash layer added to the map.");
}

// Function to calculate the maximum total value among all years
function getMaxTotal(features, selectedYear) {
    var maxTotal = 0;
    features.forEach(function (feature) {
        var totalValue = parseInt(feature.properties[selectedYear]);
        if (!isNaN(totalValue) && totalValue > maxTotal) {
            maxTotal = totalValue;
        }
    });
    return maxTotal;
}

// Function to calculate the radius using the Flannery method
function calculateFlanneryRadius(value, maxValue) {
    // Flannery's constant, typically set to 0.57 for optimal visual scaling
    var flanneryConstant = 0.47;

    // Calculate the radius using Flannery's scaling function
    return Math.sqrt(value / Math.PI) * flanneryConstant * Math.sqrt(maxValue / Math.PI);
}

// Function to populate the dropdown menu with year options
function populateYearDropdown(features) {
    console.log("Populating year dropdown...");

    var select = document.getElementById('yearDropdown');
    select.innerHTML = ''; // Clear existing options

    // Extract unique year values from the GeoJSON data properties
    var years = new Set();
    features.forEach(function (feature) {
        Object.keys(feature.properties).forEach(function (key) {
            if (key.startsWith("Total_")) {
                var year = key.substring(6); // Extract the year from the property name
                years.add(year);
            }
        });
    });

    // Populate the dropdown menu with year options
    years.forEach(function (year) {
        var option = document.createElement('option');
        option.value = "Total_" + year; // Set the value to the property name
        option.textContent = year; // Display the year
        select.appendChild(option);
    });

    console.log("Year dropdown populated.");
}

// Function to handle dropdown change event
function onYearChange() {
    var selectedYear = document.getElementById('yearDropdown').value;

    // Update the map based on the selected year
    updateMapByYear(selectedYear);
}

// Function to update the map based on the selected year from the dropdown
function updateMapByYear(year) {
    console.log("Selected year:", year);

    // Clear existing layers from the map
    fatalCrashLayerGroup.clearLayers();

    // Fetch GeoJSON data for Fatal Crashes
    fetch("data/FARS_CBSA.geojson")
        .then(function (response) {
            return response.json();
        })
        .then(function (data) {
            // Get the maximum total value among all years
            var maxTotal = getMaxTotal(data.features, year);

            // Display Fatal Crash points on the map for the selected year
            L.geoJson(data, {
                pointToLayer: function (feature, latlng) {
                    // Get the total value for the selected year
                    var totalValue = parseInt(feature.properties[year]);

                    // Calculate the radius using the Flannery method
                    var radius = calculateFlanneryRadius(totalValue, maxTotal);

                    // Customize marker options for Fatal Crash points
                    var markerOptions = {
                        radius: radius,
                        fillColor: "#2e251f", // Red color for Fatal Crashes
                        color: "#000",
                        weight: 1,
                        opacity: 1,
                        fillOpacity: 0.3
                    };

                    // Create a marker with popup content
                    var marker = L.circleMarker(latlng, markerOptions);
                    marker.bindPopup("<b>Fatal Crash Details</b><br/>Date: " + feature.properties.Date + "<br/>Location: " + feature.properties.Location + "<br/>Year: " + year + "<br/>Value: " + totalValue);
                    return marker;
                }
            }).addTo(fatalCrashLayerGroup);

            // Add the Fatal Crash layer group to the map
            fatalCrashLayerGroup.addTo(fatalCrashMap);

            console.log("Fatal Crash layer updated for the selected year:", year);
        })
        .catch(function (error) {
            console.error("Error loading Fatal Crash GeoJSON data:", error);
        });
}

// Function to create and update the Fatal Crash chart
function createFatalCrashChart(data) {
    console.log("Creating Fatal Crash chart...");
    // Example data format for Fatal Crash chart:
    var chartData = {
        labels: ['Category 1', 'Category 2', 'Category 3'], // Example labels
        datasets: [{
            label: 'Fatal Crashes', // Example dataset label
            data: [10, 20, 30], // Example data values
            backgroundColor: 'rgba(255, 99, 132, 0.5)' // Example background color
        }]
    };

    // Get the canvas element
    var ctx = document.getElementById('fatalCrashChart').getContext('2d');

    // Create the chart
    var chart = new Chart(ctx, {
        type: 'bar', // Type of chart (bar, line, pie, etc.)
        data: chartData, // Data for the chart
        options: {
            // Chart options (title, legend, tooltips, etc.)
        }
    });
}
// Function to fetch Fatal Crash data and update the chart
function fetchFatalCrashDataAndUpdateChart() {
    // Fetch GeoJSON data for Fatal Crashes
    fetch("data/FARS_CBSA.geojson")
        .then(function (response) {
            return response.json();
        })
        .then(function (data) {
            // Call the function to update the chart with the fetched data
            updateFatalCrashChart(data);
        })
        .catch(function (error) {
            console.error("Error fetching Fatal Crash data:", error);
        });
}

// Function to update the Fatal Crash chart with the fetched data
function updateFatalCrashChart(data) {
    console.log("Updating Fatal Crash chart...");

    // Process the data and update the chart accordingly
    // Example: Call createFatalCrashChart or any other chart-related logic here
    // createFatalCrashChart(data);
}

// Function to create and show the Systemic Initiatives map
function createSystemicInitiativesMap() {
    // Create the Systemic Initiatives map centered at a specific location and with an initial zoom level
    systemicInitiativesMap = L.map('systemicInitiativesMap').setView([37.8, -78], 7);

    // Add a base map 
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap contributors | CARTO',
        subdomains: 'abcd',
        minZoom: 2,
        maxZoom: 19
    }).addTo(systemicInitiativesMap);

    // Call the function to get and display Systemic Initiatives data on the map
    getSystemicInitiativesData();

    console.log("Creating Systemic Initiatives map...");
}

// Function to get Systemic Initiatives data and display points on the map
function getSystemicInitiativesData() {
    // Fetch GeoJSON data for Systemic Initiatives
    fetch("data/Q4_2023.geojson")
        .then(function (response) {
            return response.json();
        })
        .then(function (data) {
            // Display Systemic Initiatives points on the map
            displaySystemicInitiativesPoints(data);
        })
        .catch(function (error) {
            console.error("Error loading Systemic Initiatives GeoJSON data:", error);
        });
}

// Function to display Systemic Initiatives points on the map
function displaySystemicInitiativesPoints(data) {
    console.log("Displaying Systemic Initiatives points...");
    console.log("GeoJSON data:", data);

    L.geoJson(data, {
        pointToLayer: function (feature, latlng) {
            console.log("Feature properties:", feature.properties);

            var markerOptions = {
                radius: 7,
                color: "#000",
                weight: .3,
                opacity: 1,
                fillOpacity: 0.8
            };

            var categoryColor = getCategoryColor(feature.properties.Category);
            console.log("Category color:", categoryColor);

            if (categoryColor) {
                markerOptions.fillColor = categoryColor;
            } else {
                markerOptions.fillColor = "#ac4dee";
            }

            var marker = L.circleMarker(latlng, markerOptions);
            var popupContent = "<b>" + feature.properties.Initiative + "</b><br/>";
            popupContent += "ID: " + feature.properties.UniqueID + "<br/>";
            popupContent += "UPC: " + (feature.properties.UPC ? feature.properties.UPC : "Missing ") + "<br/>";
            popupContent += "District: " + feature.properties.Districts + "<br/>";
            popupContent += "Category: " + feature.properties.Category + "<br/>";

            marker.bindPopup(popupContent);
            return marker;
        }
    }).addTo(systemicInitiativesLayerGroup);

    systemicInitiativesLayerGroup.addTo(systemicInitiativesMap);
    console.log("Systemic Initiatives layer added to the map.");
}

// Function to get category color
function getCategoryColor(category) {
    switch (category) {
        case "Installed":
            return "#0c8028"; // green
        case "Planned and Funded":
            return "#85d55f"; // lighter Green
        case "Needed":
            return "#e97f31"; // orange
        case "Need to Verify":
            return "#fed94f"; // Yellow    
        case "Not Appropriate":
            return "#c1c0bf"; // grey    
        // Add more cases for other categories
        default:
            return null; // Return null if category is not found
    }
}
// Function to update the Systemic Initiatives map based on the selected initiative
function updateSystemicInitiativesMap() {
    // Get the selected initiative from the dropdown
    var selectedInitiative = document.getElementById('initiativeSelect').value;

    // Get selected categories from the dropdown
    var selectedCategories = Array.from(document.getElementById('categorySelect').selectedOptions).map(option => option.value);

    // Clear the existing points on the map
    systemicInitiativesLayerGroup.clearLayers();

    // If 'All Initiatives' is selected, display all points
    if (selectedInitiative === 'all' && selectedCategories.includes('all')) {
        getSystemicInitiativesData();
    } else {
        // Fetch GeoJSON data for the selected initiative
        fetch("data/Q4_2023.geojson")
            .then(function (response) {
                return response.json();
            })
            .then(function (data) {
                // Filter the GeoJSON data based on the selected initiative and categories
                var filteredData = data.features.filter(function (feature) {
                    return (selectedInitiative === 'all' || feature.properties.Initiative === selectedInitiative) &&
                        (selectedCategories.includes('all') || selectedCategories.includes(feature.properties.Category));
                });

                // Display the filtered points on the map
                displaySystemicInitiativesPoints({ type: "FeatureCollection", features: filteredData });
            })
            .catch(function (error) {
                console.error("Error loading Systemic Initiatives GeoJSON data:", error);
            });
    }
}

// Function to populate the dropdown menu with initiatives
function populateInitiativeDropdown(data) {
    console.log("Populating initiative dropdown...");

    var select = document.getElementById('initiativeSelect');
    var initiatives = []; // Initialize an empty array for initiatives

    // Extract unique initiative names from the GeoJSON data
    data.features.forEach(function (feature) {
        var initiative = feature.properties.Initiative;
        if (!initiatives.includes(initiative)) {
            initiatives.push(initiative);
        }
    });

    // Populate the dropdown menu with initiative options
    initiatives.forEach(function (initiative) {
        var option = document.createElement('option');
        option.value = initiative;
        option.textContent = initiative;
        select.appendChild(option);
    });

    console.log("Initiative dropdown populated.");
}
// Function to populate the category selector dropdown
function populateCategorySelector(data) {
    // Get unique category values from GeoJSON data
    var categories = new Set();
    data.features.forEach(function (feature) {
        categories.add(feature.properties.Category);
    });

    // Clear existing options
    var categorySelect = document.getElementById('categorySelect');
    categorySelect.innerHTML = '';

    // Add options for each category
    categories.forEach(function (category) {
        var option = document.createElement('option');
        option.value = category;
        option.text = category;
        categorySelect.appendChild(option);
    });
}



// Function to fetch data based on dropdown selection and update the chart
function fetchDataAndUpdateChart() {
    // Get selected categories from the dropdown
    var selectedCategories = Array.from(document.getElementById('categorySelect').selectedOptions).map(option => option.value);

    // Get selected initiative from the dropdown
    var selectedInitiative = document.getElementById('initiativeSelect').value;

    // Fetch data based on selected categories
    fetch("data/Q4_2023.geojson")
        .then(function (response) {
            return response.json();
        })
        .then(function (data) {
            // Filter data based on selected categories
            var filteredData = data.features.filter(function (feature) {
                return selectedCategories.includes('all') || selectedCategories.includes(feature.properties.Category);
            });

            // Example: Update the chart with the filtered data and selected initiative
            updateChart(filteredData, selectedInitiative);
        })
        .catch(function (error) {
            console.error("Error fetching data:", error);
        });
}



// Function to handle dropdown change event and update the chart
function onDropdownChange() {
    // Call the function to fetch data and update the chart
    fetchDataAndUpdateChart();
}// Function to fetch Systemic Initiatives data and update the chart

// Function to create and update the Systemic Initiatives chart
function createSystemicInitiativesChart(data) {
    console.log("Creating Systemic Initiatives chart...");

    // Initialize an object to store counts for each district
    var districtCounts = {};

    // Initialize an object to store category colors
    var categoryColors = {
        "Installed": "#0c8028", // green
        "Planned and Funded": "#85d55f", // lighter Green
        "Needed": "#e97f31", // orange
        "Need to Verify": "#fed94f", // Yellow
        "Not Appropriate": "#c1c0bf" // grey
        // Add more categories and colors as needed
    };

    // Iterate over the features in the GeoJSON data
    data.features.forEach(function (feature) {
        var district = feature.properties.Districts;
        var category = feature.properties.Category;
        // Increment the count for the district
        districtCounts[district] = (districtCounts[district] || {});
        districtCounts[district][category] = (districtCounts[district][category] || 0) + 1;
    });

    // Extract district labels and counts from the object
    var labels = Object.keys(districtCounts).sort(); // Sort district labels alphabetically
    var datasets = Object.keys(categoryColors).map(function(category) {
        var counts = labels.map(function (district) {
            return districtCounts[district][category] || 0;
        });
        return {
            label: category,
            data: counts,
            backgroundColor: categoryColors[category]
        };
    });

    // Example data format for Systemic Initiatives chart:
    var chartData = {
        labels: labels, // Labels are district names
        datasets: datasets
    };

    // Get the canvas element
    var ctx = document.getElementById('systemicInitiativesChart').getContext('2d');

    // Create the chart
    var chart = new Chart(ctx, {
        type: 'bar', // Type of chart (bar, line, pie, etc.)
        data: chartData, // Data for the chart
        options: {
            // Chart options (title, legend, tooltips, etc.)
        }
    });
}




// Function to fetch Systemic Initiatives data and update the chart
function fetchSystemicInitiativesDataAndUpdateChart() {
    // Fetch GeoJSON data for Systemic Initiatives
    fetch("data/Q4_2023.geojson")
        .then(function (response) {
            return response.json();
        })
        .then(function (data) {
            // Call the function to create the chart with the fetched data
            createSystemicInitiativesChart(data);
        })
        .catch(function (error) {
            console.error("Error fetching Systemic Initiatives data:", error);
        });
}



document.addEventListener('DOMContentLoaded', function () {
    console.log("Initializing maps and charts...");

    // Check if the page is FatalCrash HTML
    if (window.location.pathname.includes("FatalCrash_MSA.html")) {
        console.log("Initializing Fatal Crash map and chart...");
        createFatalCrashMap(); // Create FatalCrash map
        fetchFatalCrashDataAndUpdateChart(); // Fetch FatalCrash data and update chart
    }
    
    // Check if the page is Systemic Initiatives HTML
    else if (window.location.pathname.includes("SystemicInitiatives.html")) {
        console.log("Initializing Systemic Initiatives map and chart...");
        createSystemicInitiativesMap(); // Create Systemic Initiatives map
        fetchSystemicInitiativesDataAndUpdateChart(); // Fetch Systemic Initiatives data and update chart

        // Fetch GeoJSON data and populate the dropdown menus
        fetch("data/Q4_2023.geojson")
            .then(function (response) {
                return response.json();
            })
            .then(function (data) {
                populateInitiativeDropdown(data); // Populate the initiative dropdown
                populateCategorySelector(data); // Populate the category selector
            })
            .catch(function (error) {
                console.error("Error loading Systemic Initiatives GeoJSON data:", error);
            });
    }
});

