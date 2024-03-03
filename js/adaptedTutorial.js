// Map of GeoJSON data from MegaCities.geojson
// Declare map var in the global scope
var map;

// Function to instantiate the Leaflet map
function createMap() {
    // Create the map
    map = L.map('map', {
        center: [20, 0],
        zoom: 2
    });

    // Add OSM base tilelayer
    L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
    }).addTo(map);

    // Call getData function
    getData();
};

// Function to attach popups to each mapped feature
function onEachFeature(feature, layer) {
    // No property named popupContent; instead, create html string with all properties
    var popupContent = "";
    if (feature.properties) {
        // Loop to add feature property names and values to html string
        for (var property in feature.properties) {
            popupContent += "<p>" + property + ": " + feature.properties[property] + "</p>";
        }
        layer.bindPopup(popupContent);
    };
};

// Function to retrieve the data and place it on the map
function getData() {
    // Load the data
    fetch("data/MegaCities.geojson")
        .then(function (response) {
            return response.json();
        })
        .then(function (json) {
            var geojsonMarkerOptions = {
                radius: 8,
                fillColor: "#ff7800",
                color: "#000",
                weight: 1,
                opacity: 1,
                fillOpacity: 0.8
            };

            // Create a Leaflet GeoJSON layer with onEachFeature and pointToLayer and add it to the map
            L.geoJson(json, {
                onEachFeature: onEachFeature,
                pointToLayer: function (feature, latlng) {
                    return L.circleMarker(latlng, geojsonMarkerOptions);
                }
            }).addTo(map);
        });
};

document.addEventListener('DOMContentLoaded', createMap);
