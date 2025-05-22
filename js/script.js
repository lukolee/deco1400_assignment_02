// Wait till DOM has loaded fully before running header/footer attach function
window.addEventListener('DOMContentLoaded', loadLayout);

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

// Clicking the site logo in the navigation bar takes you to the home Page
// added to button with onclick since the button is attached to the page later
function goHome() {
    console.log("gohome call");
    window.location.href = "index.html";
}


// ============================================================================
//
// Pattern Overview Page
//
// ============================================================================

// Pattern Overview Image Gallery.
// Replace gallery hero image with thumb image when it has been clicked.
const hero = document.querySelector('.gallery_hero');
const thumbs = document.querySelectorAll('.thumb'); // list of thumbs
// For each thumb, add event listener.
// Upon click update its src attribute with the clicked thumb's.
thumbs.forEach(thumb => {
    thumb.addEventListener('click', () => {
        hero.src = thumb.src;
        hero.alt = thumb.alt;
    });
});

// Clicking the crochet mode button takes you to the crochet mode Page
// and passes some url search parameters to the page knows which pattern to show
document.getElementById("crochet_mode_button").addEventListener("click", () => {
    const pattern = "jacaranda-pattern"
    const params = new URLSearchParams({ pattern });
    window.location.href = `crochet_mode.html?${params.toString()}`;
});
