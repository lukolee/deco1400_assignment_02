// Wait till DOM has loaded fully before running header/footer attach function
window.addEventListener('DOMContentLoaded', () => {
    loadLayout();
    loadPatterns();
});

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
    loadComponent('footer', 'js/footer.html');
}

// Clicking the site logo in the navigation bar takes you to the home Page
// added to button with onclick since the button is attached to the page later
function goHome() {
    window.location.href = "index.html";
}

// Since the apttern data is loaded asynchronously, we only want to
// be using it on those pages where each function is required.
function handlePatternUsage() {
    patternCategories();

    if (window.location.pathname.endsWith('index.html')) {
        populateSections();

    }

    if (window.location.pathname.endsWith('pattern_overview.html')) {

    }
}

// Null till the promise has been fullfilled
let patternDataList = null;
// dictionary of patterns, organised with key of category, and value the pattern
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map
let allPatternCategories = new Map();

/**
* Asynchronously load the pattern data file and turn into JSON,
* then extract entries and add to a global pattern data array.
* thanks to MDN for help with JSON and extracting values
* https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/values
*/
async function loadPatterns() {
    try {
        const result = await fetch('/patterns.json');
        const patternJSON = await result.json();

        patternDataList = Object.entries(patternJSON);
        // pattern data is loaded, use it
        handlePatternUsage();
    } catch (error) {
        console.error(error);
    }
}


/**
* Organise pattern categories across all patterns.
* Adds each unique category from each pattern to a global map,
* and each pattern matching each category is added to that map key.
*/
function patternCategories() {
    allPatternCategories["Popular Patterns"] = [];
    patternDataList.forEach(entry => {
        // add the object key into the object as a datafield
        // used for e.g., page nav
        const entry_key = entry[0];
        const value = entry[1];
        value.key = entry_key;
        if (value['category']) {
            value['category'].forEach(cat => {
                if (!allPatternCategories.get(cat)) {
                    // if the category doesnt exist, initialise as a list.
                    allPatternCategories.set(cat, []);
                }
                allPatternCategories.get(cat).push(value);
            })
        }
    })
}

// ============================================================================
//
// Index page Page
//
// ============================================================================


function populateSections() {
    const container = document.getElementById('pattern_groups');

    // build each section, and attach to the container.
    allPatternCategories.entries().forEach(entry => {
        // zeroth element is the title, 1st is the children
        const category = entry[0]
        const category_patterns = entry[1]

        // create section
        const section = document.createElement('section');
        section.id = category;

        // create a title for the section
        const title = document.createElement('h2');
        title.textContent = category;
        section.appendChild(title);

        const card_parent = document.createElement('div');
        card_parent.classList.add('pattern_card_parent');
        sectionAddCards(card_parent, category_patterns);
        section.appendChild(card_parent);

        container.appendChild(section);
    })
}

/**
* Populate a section with cards for each pattern matching the category.
*/
function sectionAddCards(parent, category_patterns) {
    category_patterns.forEach(pattern => {
        const card = document.createElement('div');
        card.classList.add("pattern_card");
        card.id = pattern['key'];

        const pattern_image = document.createElement('img');
        pattern_image.src = pattern['hero-image']['src'];
        pattern_image.alt = pattern['hero-image']['alt'];

        const title = document.createElement('span');
        title.classList.add("card_title");
        title.textContent = pattern['name'];

        const blurb = document.createElement('span');
        blurb.classList.add("card_description");
        blurb.textContent = pattern['blurb'];

        const card_text = document.createElement('div');
        card_text.classList.add("pattern_card_text");

        card_text.append(title, blurb);
        card.append(pattern_image, card_text);

        parent.appendChild(card);
    })
}



// ============================================================================
//
// Pattern Overview Page
//
// ============================================================================
if (window.location.pathname.endsWith('pattern_overview.html')) {
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

    let pattern = new URLSearchParams(document.location.search).get("pattern");
}




// ============================================================================
//
// Crochet Mode Page
//
// ============================================================================
