document.addEventListener('DOMContentLoaded', function() {
    setupSystemicInitiativesMap();
    fetchData('data/Q4_2023.geojson')
        .then(data => {
            handleSystemicInitiativesData(data);
            populateChartDropdown(data);
            populateMapDropdown(data);  // Initialize map dropdown
        })
        .catch(console.error);
});

function setupSystemicInitiativesMap() {
    var mapDiv = document.getElementById('systemicInitiativesMap');
    if (mapDiv) {
        systemicInitiativesMap = L.map('systemicInitiativesMap').setView([37.8, -78], 7);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '© OpenStreetMap contributors | CARTO',
            subdomains: 'abcd',
            minZoom: 2,
            maxZoom: 19
        }).addTo(systemicInitiativesMap);
        systemicInitiativesLayerGroup = L.layerGroup().addTo(systemicInitiativesMap);
        addLegend(); // Initialize the legend for the map
    }
}

function fetchData(url) {
    return fetch(url)
        .then(response => response.json())
        .catch(error => {
            console.error('Failed to fetch data: ', error);
            throw error;
        });
}

function handleSystemicInitiativesData(data) {
    displaySystemicInitiativesPoints(data);
    createSystemicInitiativesChart(data);
}

function displaySystemicInitiativesPoints(data) {
    systemicInitiativesLayerGroup.clearLayers(); // Clear previous layers
    L.geoJSON(data, {
        pointToLayer: function(feature, latlng) {
            return L.circleMarker(latlng, {
                radius: 5.5,
                fillColor: getCategoryColor(feature.properties.Category),
                color: "#000",
                weight: 0.5,
                opacity: 0.6,
                fillOpacity: 0.75
            }).bindPopup(`
                <b>Initiative:</b> ${feature.properties.Initiative}<br>
                <b>Districts:</b> ${feature.properties.Districts}<br>
                <b>UPC:</b> ${feature.properties.UPC || "Missing UPC Information"}<br>
                <b>Comments:</b> ${feature.properties.Comments || "No comments"}
            `);
        }
    }).addTo(systemicInitiativesLayerGroup);
}

function createSystemicInitiativesChart(data) {
    updateChart(data);
}

function populateChartDropdown(data) {
    var select = document.getElementById('chartInitiativeSelect');
    select.innerHTML = '';  // Clear previous options
    select.add(new Option("All Initiatives", "all"));
    data.features.map(feature => feature.properties.Initiative).forEach(initiative => {
        if (!select.querySelector(`option[value="${initiative}"]`)) {
            let option = new Option(initiative, initiative);
            select.add(option);
        }
    });
    select.addEventListener('change', () => updateChart(data, select.value));
}

function populateMapDropdown(data) {
    var select = document.getElementById('mapInitiativeSelect');
    select.innerHTML = '';  // Clear previous options
    const initiativesSet = new Set();
    data.features.forEach(feature => {
        const initiative = feature.properties.Initiative;
        if (initiative && !initiativesSet.has(initiative)) {
            initiativesSet.add(initiative);
            let option = new Option(initiative, initiative);
            select.add(option);
        }
    });
    select.removeEventListener('change', updateSystemicInitiativesMap);
    select.addEventListener('change', () => updateSystemicInitiativesMap(data, select.value));
}

function updateSystemicInitiativesMap(data, filter = "all") {
    var filteredData = filter === "all" ? data : data.features.filter(feature => feature.properties.Initiative === filter);
    displaySystemicInitiativesPoints({ type: "FeatureCollection", features: filteredData });
}

function updateChart(data, filter = "all") {
    var filteredData = filter === "all" ? data.features : data.features.filter(feature => feature.properties.Initiative === filter);
    var districtCategoryCounts = {};

    filteredData.forEach(feature => {
        var district = feature.properties.Districts;
        var category = feature.properties.Category;
        if (!districtCategoryCounts[district]) {
            districtCategoryCounts[district] = { total: 0, categories: {} };
        }
        if (!districtCategoryCounts[district].categories[category]) {
            districtCategoryCounts[district].categories[category] = 0;
        }
        districtCategoryCounts[district].categories[category]++;
        districtCategoryCounts[district].total++;
    });

    var chartData = {
        labels: Object.keys(districtCategoryCounts).sort(),
        datasets: []
    };

    var categoryColors = {
        "Installed": "#0c8028",
        "Planned and Funded": "#85d55f",
        "Needed": "#e97f31",
        "Need to Verify": "#fed94f",
        "Not Appropriate": "#c1c0bf"
    };

    Object.keys(categoryColors).forEach(category => {
        var data = chartData.labels.map(district => {
            var count = districtCategoryCounts[district].categories[category] || 0;
            return count;  // Simply return the count here
        });
        chartData.datasets.push({
            label: category,
            backgroundColor: categoryColors[category],
            data: data,
            stack: 'Stack 0'
        });
    });

    if (window.systemicInitiativesChart && typeof window.systemicInitiativesChart.destroy === 'function') {
        window.systemicInitiativesChart.destroy();
    }

    var ctx = document.getElementById('systemicInitiativesChart').getContext('2d');
    window.systemicInitiativesChart = new Chart(ctx, {
        type: 'bar',
        data: chartData,
        options: {
            responsive: true,
            scales: {
                x: { stacked: true },
                y: { stacked: true }
            },
            tooltips: {
                callbacks: {
                    label: function(tooltipItem, data) {
                        var dataset = data.datasets[tooltipItem.datasetIndex];
                        var value = dataset.data[tooltipItem.index];
                        var total = districtCategoryCounts[chartData.labels[tooltipItem.index]].total;
                        var percentage = (value / total * 100).toFixed(2);
                        return `${dataset.label}: ${value} (${percentage}%)`;
                    }
                }
            }
        }
    });
}

function getCategoryColor(category) {
    switch (category) {
        case "Installed": return "#0c8028";
        case "Planned and Funded": return "#85d55f";
        case "Needed": return "#e97f31";
        case "Need to Verify": return "#fed94f";
        case "Not Appropriate": return "#c1c0bf";
        default: return "#ccc";
    }
}

function addLegend() {
    var legend = L.control({position: 'bottomleft'});

    legend.onAdd = function (map) {
        var div = L.DomUtil.create('div', 'info legend');
        var categories = [
            { name: "Installed", color: "#0c8028" },
            { name: "Planned and Funded", color: "#85d55f" },
            { name: "Needed", color: "#e97f31" },
            { name: "Need to Verify", color: "#fed94f" },
            { name: "Not Appropriate", color: "#c1c0bf" }
        ];

        categories.forEach(function(category) {
            div.innerHTML +=
                '<i style="background:' + category.color + '; width: 10px; height: 10px; border-radius: 50%; display: inline-block; margin-right 5px;"></i> ' +
                '<span>' + category.name + '</span><br>';
        });

        return div;
    };

    legend.addTo(systemicInitiativesMap);
}
