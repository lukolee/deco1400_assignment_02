// load a html snippet from a file url
function loadComponent(id, url) {
    fetch(url)
        .then(res => {
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            return res.text();
        })
        .then(data => {
            document.getElementById(id).innerHTML = data;
        })
        .catch(err => console.error(`Could not load ${url}: ${err}`));
}

// allow for laoding html snippets / images into a page and attach to
// an element with id "navbar"
function loadLayout() {
    loadComponent('navbar', 'js/navbar.html');
    // loadComponent('footer', 'footer.html');
}
