// utility.js
function fetchData(url) {
    return fetch(url)
        .then(response => response.json())
        .catch(error => console.error('Failed to fetch data: ', error));
}

// index.js
document.addEventListener('DOMContentLoaded', function() {
    console.log("Welcome to the Traffic Safety Data Explorer!");
    // Add event listeners or other initialization code specific to the homepage
});

function togglePanel() {
    var panel = document.getElementById('sidePanel');
    panel.classList.toggle('open');
}
