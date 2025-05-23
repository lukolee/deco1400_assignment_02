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
        let patternKey = new URLSearchParams(document.location.search).get("pattern");
        enterCrochetMode(patternKey);
        populateOverviewData(patternKey);
        patternGalleryThumbStitching();

        // page title to the name of the current patterns
        document.title = patternDataList[patternKey]["name"];
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

        patternDataList = patternJSON;
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
* MDN helped greatly in iterating over the JSON by using entries
* https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/entries
*/
function patternCategories() {
    allPatternCategories["Popular Patterns"] = [];
    Object.entries(patternDataList).forEach(entry => {
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

/**
* Populate each section's pattern_card_parent with the cards.
* Data for the carsd is pulled from allPatternCategories,
* and relevant HTML elements are created and appended.
*/
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
        // anon else it runs instantly
        card.onclick = () => { navigateToPattern(pattern['key']) }

        parent.appendChild(card);
    })
}

function navigateToPattern(location) {
    window.location.href = `pattern_overview.html?pattern=${location}`;
}

// ============================================================================
//
// Pattern Overview Page
//
// ============================================================================
/**
* Append a click event listener to each thumbnail in the image gallery.
* Upon click the source and alt attribute of the hero image (big one)
* is updated to that thumbnail's source and alt.
*/
function patternGalleryThumbStitching() {
    const hero = document.querySelector('#gallery_hero');
    const thumbs = document.querySelectorAll('.thumb'); // list of thumbs
    // For each thumb, add event listener.
    // Upon click update its src attribute with the clicked thumb's.
    thumbs.forEach(thumb => {
        thumb.addEventListener('click', () => {
            hero.src = thumb.src;
            hero.alt = thumb.alt;
        });
    });
}

/**
* Add an event listener to the crochet mode button.
* Upon being clicked, navigate to destination,
* which is the pattern key, so the crochet mode knows which instructions
* to show.
*/
function enterCrochetMode(destination) {
    document.getElementById("crochet_mode_button").addEventListener("click", () => {
        window.location.href = `crochet_mode.html?pattern=${destination}`;
    });
}

/**
* Populate the overview page with data extracted from the datalist with
* the patternKey key.
*/
function populateOverviewData(patternKey) {
    const patternData = patternDataList[patternKey];
    console.log(patternData);

    const title = document.getElementById('pattern_overview_title');
    title.textContent = patternData["name"];

    populateYarnSection(patternData["yarn"]);
    populatePatternDetails(patternData["pattern_details"]);
    populatePatterOverview(patternData["overview"]);
    populatePatternGallery(patternData["hero-image"], patternData['images']);
}

/**
* Iterate over all yarn objects required for a pattern,
* and convert to plain language paragraph of the yarn needed.
* @param {*} yarnList The full list of yarn required for the pattern.
*/
function populateYarnSection(yarnList) {
    const yarn_parent = document.getElementById("pattern_yarn");
    yarn_parent.textContent = "You will need: "

    // thankfully forEach lets us see the array being iterated over and then
    // current index,
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach
    // if many elements, if the only element, or if the last element.
    yarnList.forEach((yarnEntry, index, array) => {
        if (!(index === array.length - 1)) {
            yarn_parent.textContent += ` ${yarnEntry["quantity_skeins"]} skeins of ${yarnEntry["name"]}, `;
        } else if (array.length === 1) {
            yarn_parent.textContent += ` ${yarnEntry["quantity_skeins"]} skeins of ${yarnEntry["name"]}.`;
        } else {
            yarn_parent.textContent += ` and ${yarnEntry["quantity_skeins"]} skeins of ${yarnEntry["name"]}.`;
        }

    })
}

/**
* Populates the details section of each pattern.
* Extract entries from an onject, with titles, and children.
* Then populates rows of a table with the details.
* @param {*} pattern_details  The list of objects specifying the details.
*/
function populatePatternDetails(pattern_details) {
    const details_parent = document.getElementById("pattern_details");

    Object.entries(pattern_details).forEach(([key, entry]) => {
        const row = document.createElement('tr');

        const row_title = document.createElement("td");
        row_title.textContent = key;

        const row_data = document.createElement("td");
        row_data.textContent = entry;
        // might have to prettify list -> string

        row.append(row_title, row_data);
        details_parent.appendChild(row);
    });
}

/**
* Attach the overview_data to the correct text element on the page.
* @param {*} overview_data The text object with description.
*/
function populatePatterOverview(overview_data) {
    const overview = document.getElementById("pattern_overview_description");
    overview.textContent = overview_data;
}

/**
* Load the appropriate images into the gallery, and add elements where required.
* then set the source and alt attributes thereof.
* @param {*} hero_image Hero image Object
* @param {*} images List of image Objects
*/
function populatePatternGallery(hero_image, images) {
    // remember to make the first image thumbnail the hero so when others
    // are selected you can get the hero back

    // find the gallery parent everything is attached to
    const crochet_gallery = document.getElementById("crochet_gallery");
    // find the gallery the thumbnails are attached to.
    const thumb_gallery = document.getElementById("thumb_gallery");
    // Find the hero image (placeholder by default in case load fails).
    const gallery_hero = document.getElementById("gallery_hero");

    gallery_hero.src = hero_image["src"];
    gallery_hero.alt = hero_image["alt"];

    // The hero image should be the first element in thumbnail gallery.
    const hero_thumbnail = document.createElement('img');
    hero_thumbnail.classList.add("thumb")
    hero_thumbnail.src = hero_image["src"];
    hero_thumbnail.alt = "Item 1: " + hero_image["alt"];
    thumb_gallery.appendChild(hero_thumbnail);

    // Add the index of image in array + 1 to alt text, plus
    // its alt text stored in the JSON
    images.forEach((image, index, array) => {
        const thumbnail = document.createElement('img');
        thumbnail.classList.add("thumb")
        thumbnail.src = image["src"];
        // appends the index to alt text
        thumbnail.alt += `Item ${index + 1}: `;
        thumbnail.alt += image["alt"];

        thumb_gallery.appendChild(thumbnail);
    })
}
// ============================================================================
//
// Crochet Mode Page
//
// ============================================================================
