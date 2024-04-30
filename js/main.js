// Declare a variable to hold the map
var map;

// Declare a layer group for boundary, freeway, and proportional symbols
var layerGroup = L.layerGroup();

// Declare variable for marker options
var geojsonMarkerOptions = {
    radius: 8,
    fillColor: "#ff7800",
    color: "#000",
    weight: 1,
    opacity: 1,
    fillOpacity: 0.8 
};

// Declare variable for the minimum attribute value
var minValue;

// Declare variable to hold the current attribute
var currentAttribute;

// Declare variable to hold the attributes
var attributes;

// Declare boundaryLayer and freewayLayer globally
var boundaryLayer, freewayLayer;

// Function to process data and extract attributes
function processData(data) {
    // Empty array to hold attributes
    attributes = [];

    // Properties of the first feature in the dataset
    var properties = data.features[0].properties;

    // Loop through each attribute name in properties
    for (var attribute in properties) {
        // Only take attributes with names starting with "Total_"
        if (attribute.indexOf("Total_") === 0) {
            attributes.push(attribute);
        }
    }

    // Check the result
    console.log(attributes);

    return attributes;
}

// Function to create and show the map
function createMap() {
    // Center map
    map = L.map('map', {
        center: [45, -85],
        zoom: 4
    });

    // Add a base map 
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap contributors | CARTO',
        subdomains: 'abcd',
        minZoom: 2,
        maxZoom: 19
    }).addTo(map);

    // Add the layer group to the map
    layerGroup.addTo(map);

    // Add the boundary layer after adding the layerGroup
    addBoundaryLayer();

    // Add the freeway layer after adding the boundary layer
    addFreewayLayer();

    // Call a function to get and display data on the map
    getData();

    // Create checkboxes for each layer
    createLayerCheckboxes();

    // Set the initial label text
    updateSliderLabel(attributes[0]);
}

// Function to create checkboxes for each layer
function createLayerCheckboxes() {
    // Create checkbox for the boundary layer
    var boundaryCheckbox = document.createElement('input');
    boundaryCheckbox.type = 'checkbox';
    boundaryCheckbox.id = 'boundaryCheckbox';
    boundaryCheckbox.checked = true; // Default to checked
    boundaryCheckbox.addEventListener('change', function () {
        console.log("Boundary checkbox changed");
        toggleLayerVisibility(boundaryLayer, this.checked);
    });

    // Label for the boundary layer checkbox
    var boundaryLabel = document.createElement('label');
    boundaryLabel.htmlFor = 'boundaryCheckbox';
    boundaryLabel.textContent = 'Boundary Layer';

    // Create checkbox for the freeway layer
    var freewayCheckbox = document.createElement('input');
    freewayCheckbox.type = 'checkbox';
    freewayCheckbox.id = 'freewayCheckbox';
    freewayCheckbox.checked = true; // Default to checked
    freewayCheckbox.addEventListener('change', function () {
        console.log("Freeway checkbox changed");
        toggleLayerVisibility(freewayLayer, this.checked);
    });

    // Label for the freeway layer checkbox
    var freewayLabel = document.createElement('label');
    freewayLabel.htmlFor = 'freewayCheckbox';
    freewayLabel.textContent = 'Freeway Layer';

    // Append checkboxes and labels to the checkboxes div
    var checkboxesDiv = document.getElementById('checkboxes');
    checkboxesDiv.appendChild(boundaryCheckbox);
    checkboxesDiv.appendChild(boundaryLabel);
    checkboxesDiv.appendChild(document.createElement('br'));
    checkboxesDiv.appendChild(freewayCheckbox);
    checkboxesDiv.appendChild(freewayLabel);
    checkboxesDiv.appendChild(document.createElement('br'));
}

// Function to add popups to each feature on the map
function onEachFeature(feature, layer) {
    // Build popup content string with fixed format
    var popupContent = "<p><b>Metro Area:</b> " + feature.properties["Metro Area"] + "</p>";
    popupContent += "<p><b>Fatal Crashes, " + attributes[0].split("_")[1] + ":</b> " + feature.properties[attributes[0]] + "</p>";

    // Add line for the "Sum" column
    popupContent += "<p><b>Total Crashes 2012-2021:</b> " + feature.properties["Sum"] + "</p>";

    // Bind the popup to the circle marker
    layer.bindPopup(popupContent);
}

// Function to add the boundary layer to the layer group
function addBoundaryLayer() {
    // Load boundary GeoJSON data
    fetch("data/CBSA_QGIS_Boundary.geojson")
        .then(function (response) {
            return response.json();
        })
        .then(function (boundaryJson) {
            // Create a GeoJSON layer for boundaries
            boundaryLayer = L.geoJson(boundaryJson, {
                style: {
                    color: "#2b2c2b",  // Adjust the color as needed
                    weight: .1,
                    fillOpacity: .02
                }
            });

            // Add the boundary layer to the layer group
            boundaryLayer.addTo(layerGroup);

            // Bring the boundary layer to the bottom
            boundaryLayer.bringToBack();

            // Log a message to the console indicating successful loading
            console.log("Boundary layer added successfully!");
        })
        .catch(function (error) {
            console.error("Error loading boundary GeoJSON:", error);
        });
}

// Function to add the freeway layer to the layer group
function addFreewayLayer() {
    // Load freeway GeoJSON data
    fetch("data/USA_Freeway_System.geojson")
        .then(function (response) {
            return response.json();
        })
        .then(function (freewayJson) {
            // Create a GeoJSON layer for the freeway system
            freewayLayer = L.geoJson(freewayJson, {
                style: {
                    color: "#140c64",  // Adjust the color as needed
                    weight: .45

                }
            });

            // Add the freeway layer to the layer group
            freewayLayer.addTo(layerGroup);

            // Log a message to the console indicating successful loading
            console.log("Freeway layer added successfully!");
        })
        .catch(function (error) {
            console.error("Error loading freeway GeoJSON:", error);
        });
}

// Function to add circle markers for point features on the top layer
function addCircleMarkers() {
    // Load GeoJSON data
    fetch("data/FARS_CBSA.geojson")
        .then(function (response) {
            return response.json();
        })
        .then(function (json) {
            // Call function to process data and create proportional symbols with Flannery scaling
            attributes = processData(json); // Assign attributes to the global variable
            minValue = calcMinValue(json, attributes[0]); // Pass the first attribute to calcMinValue

            // Create proportional symbols layer
            createPropSymbols(json, attributes);

            // Log the state of attributes after processing
            console.log("Attributes after processing:", attributes);

            // Set the initial label text
            updateSliderLabel(attributes[0]);

            // Bring the freeway layer to the middle
            freewayLayer.bringToFront();
        })
        .catch(function (error) {
            console.error("Error loading GeoJSON data:", error);
        });
}

// Function to toggle layer visibility
function toggleLayerVisibility(layer, isVisible) {
    console.log("Toggle requested for layer:", layer);
    console.log("Is Visible:", isVisible);

    if (layer) {
        if (isVisible) {
            layer.addTo(layerGroup);
            console.log("Layer added to layerGroup");
        } else {
            layerGroup.removeLayer(layer);
            console.log("Layer removed from layerGroup");
        }
    }
}

// Step 3: Add circle markers for point features to the map
function createPropSymbols(data, attributes) {
    // Step 4: Determine which attribute to visualize with proportional symbols
    var attribute = attributes[0]; // Set a default attribute

    // Step 5: For each feature, determine its value for the selected attribute
    var min = calcMinValue(data, attribute);

    // Step 6: Give each feature's circle marker a radius based on its attribute value using Flannery scaling
    L.geoJson(data, {
        pointToLayer: function (feature, latlng) {
            var attValue = Number(feature.properties[attribute]);
            var radius = calcPropRadius(attValue, min);

            // Create circle markers
            return L.circleMarker(latlng, {
                radius: radius,
                fillColor: "#d42903",
                color: "#771701",
                weight: .35,
                opacity: .8,
                fillOpacity: 0.2
            });
        },
        onEachFeature: onEachFeature  // Call the onEachFeature function
    }).addTo(layerGroup);

    // Step 7: Call function to create sequence controls after loading data
    createSequenceControls(attributes);

    // Step 8: Bring the layer group to the front
    layerGroup.bringToFront();
}

// Function to create sequence controls
function createSequenceControls(attributes) {
    // Clear existing content of the panel
    document.querySelector('#panel').innerHTML = '';

    // Log to check if the panel element is found
    console.log(document.querySelector("#panel"));

    // Create range input element (slider) with a label
    var slider = "<input id='yearSlider' class='range-slider' type='range' min='0' max='" + (attributes.length - 1) + "' value='0'></input>";

    // Log to check if the slider HTML is being generated
    console.log(slider);

    // Insert slider into the panel
    document.querySelector("#panel").insertAdjacentHTML('beforeend', slider);

    // Add a label to display the current year
    document.querySelector("#panel").insertAdjacentHTML('beforeend', "<div id='sliderLabel'></div>");

    // Add step buttons
    document.querySelector('#panel').insertAdjacentHTML('beforeend', '<button class="step" id="reverse"><</button>');
    document.querySelector('#panel').insertAdjacentHTML('beforeend', '<button class="step" id="forward">></button>');

    // Step 5: input listener for slider and click listener for buttons
    document.querySelector('.range-slider').addEventListener('input', function () {
        onSliderChange(this.value, attributes);
    });

    document.querySelectorAll('.step').forEach(function (step) {
        step.addEventListener("click", function () {
            onStepButtonClick(step.id, attributes);
        });
    });
}

// function to update the slider label with the corresponding year
function updateSliderLabel(attribute) {
    // Extract the year from the attribute name
    var yearFromAttribute = attribute.split("_")[1];

    console.log("Slider Label Updated to Year:", yearFromAttribute); // Added log
    document.getElementById('sliderLabel').textContent = "Year: " + yearFromAttribute;
}

// Function to handle changes in slider value
function onSliderChange(value, attributes) {
    updatePropSymbols(attributes[value]);
    updateSliderLabel(attributes[value]);
}

// Function to handle step button clicks
function onStepButtonClick(buttonId, attributes) {
    var index = document.querySelector('.range-slider').value;

    // Step 6: increment or decrement depending on button clicked
    if (buttonId == 'forward') {
        index++;
        // Step 7: if past the last attribute, wrap around to the first attribute
        index = index > attributes.length - 1 ? 0 : index;
    } else if (buttonId == 'reverse') {
        index--;
        // Step 7: if past the first attribute, wrap around to the last attribute
        index = index < 0 ? attributes.length - 1 : index;
    }

    // Step 8: update slider
    document.querySelector('.range-slider').value = index;

    // Step 9: pass new attribute to update symbols and label
    updatePropSymbols(attributes[index]);
    updateSliderLabel(attributes[index]);
}

// Function to update proportional symbols on the map
function updatePropSymbols(attribute) {
    console.log("updatePropSymbols - attribute:", attribute);
    map.eachLayer(function (layer) {
        if (layer.feature && layer.feature.properties[attribute]) {
            console.log("Layer feature properties:", layer.feature.properties);
            // Update the layer style and popup
            // Access feature properties
            var props = layer.feature.properties;

            // Update each feature's radius based on new attribute values
            var radius = calcPropRadius(props[attribute], minValue);
            layer.setRadius(radius);

            console.log("updatePropSymbols - radius:", radius);

            // Add city to popup content string with fixed format
            var popupContent = "<p><b>Metro Area:</b> " + props["Metro Area"] + "</p>";
            popupContent += "<p><b>Fatal Crashes, " + attribute.split("_")[1] + ":</b> " + props[attribute] + "</p>";

            // Add line for the "Sum" column
            popupContent += "<p><b>Total Crashes 2012-2021:</b> " + props["Sum"] + "</p>";

            // Update popup content
            var popup = layer.getPopup();
            popup.setContent(popupContent).update();
        }
    });
}

// Function to calculate the minimum value for the selected attribute
function calcMinValue(data, attribute) {
    var min = Number.POSITIVE_INFINITY; // Initialize with positive infinity

    // Loop through the data to find the minimum value
    data.features.forEach(function (feature) {
        var value = Number(feature.properties[attribute]);

        // Check if the value is a valid number
        if (!isNaN(value)) {
            min = Math.min(min, value);
        }
    });

    // Check if no valid numbers were found
    if (min === Number.POSITIVE_INFINITY || isNaN(min) || min === 0) {
        console.log("calcMinValue - No valid numbers found for the attribute. Using a default minimum value.");
        min = 1; // Set a default minimum value (adjust as needed)
    }

    console.log("calcMinValue - final min:", min);
    return min;
}

// Function to calculate the proportional radius using Flannery scaling
function calcPropRadius(attValue, min) {
    console.log("calcPropRadius - attValue:", attValue);
    console.log("calcPropRadius - min:", min);

    // Check if attValue or min is not a valid number, or if min is zero
    if (isNaN(attValue) || isNaN(min) || min === 0) {
        console.log("calcPropRadius - Invalid values detected. Radius set to a default value.");
        return 5; // Set a default radius value
    }

    var scaleFactor = 50; // You can adjust this scaling factor as needed
    var radius = 0.008 * Math.pow(attValue / min, 0.5715) * scaleFactor;

    // Check if the calculated radius is zero or NaN
    if (radius === 0 || isNaN(radius)) {
        console.log("calcPropRadius - Invalid values detected. Radius set to a default value.");
        radius = .5; // Set a default radius value
    }

    console.log("calcPropRadius - radius:", radius);
    return radius;
}

// Function to fetch and display GeoJSON data on the map
function getData() {
    // Load GeoJSON data from a file
    fetch("data/FARS_CBSA.geojson")
        .then(function (response) {
            return response.json();
        })
        .then(function (json) {
            // Call function to process data and create proportional symbols with Flannery scaling
            attributes = processData(json); // Assign attributes to the global variable
            minValue = calcMinValue(json, attributes[0]); // Pass the first attribute to calcMinValue

            // Create proportional symbols layer
            createPropSymbols(json, attributes);

            // Log the state of attributes after processing
            console.log("Attributes after processing:", attributes);

            // Create sequence controls (including the slider)
            createSequenceControls(attributes);
        })
        .catch(function (error) {
            console.error("Error loading GeoJSON data:", error);
        });
}

function toggleSidePanel() {
    var sidePanel = document.querySelector('.sidePanel');
    sidePanel.classList.toggle('show');
}
// Execute the createMap function when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function () {
    createMap();
});

