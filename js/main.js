// Declare a variable to hold the map
var map;

// Function to create and show the map
function createMap() {
    // Create a map centered at latitude 12 and longitude -95.7129
    map = L.map('map', {
        center: [12, -95.7129],
        zoom: 4
    });

    // Add a base map from CartoCDN
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap contributors | CARTO',
        subdomains: 'abcd',
        minZoom: 2,
        maxZoom: 19
    }).addTo(map);

    // Call a function to get and display data on the map
    getData();
}

// Function to add popups to each feature on the map
function onEachFeature(feature, layer) {
    // If the feature has properties, create HTML content for a popup
    var popupContent = "";
    if (feature.properties) {
        // Loop through feature properties and add them to the popup HTML
        for (var property in feature.properties) {
            popupContent += "<p>" + property + ": " + feature.properties[property] + "</p>";
        }
        // Attach the popup to the feature on the map
        layer.bindPopup(popupContent);
    }
}

// Function to fetch and display GeoJSON data on the map
function getData() {
    // Load GeoJSON data from a file
    fetch("data/FARS_CBSA.geojson")
        .then(function (response) {
            return response.json();
        })
        .then(function (json) {
            // Define options for styling GeoJSON features on the map
            var geojsonMarkerOptions = {
                radius: 3,
                fillColor: "#e25910",
                color: "#c22802",
                weight: 1,
                opacity: 1,
                fillOpacity: 0.8
            };

            // Create a layer for GeoJSON features and add it to the map
            L.geoJson(json, {
                onEachFeature: onEachFeature,
                pointToLayer: function (feature, latlng) {
                    return L.circleMarker(latlng, geojsonMarkerOptions);
                }
            }).addTo(map);
        });
}

// Execute the createMap function when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', createMap);
