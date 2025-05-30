// Wait till DOM has loaded fully before running header/footer attach function
window.addEventListener('DOMContentLoaded', () => {
    loadLayout();
    loadPatterns();
    loadYarn();
});

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
    // try {
    //     const result = await fetch('/data/patterns.json');
    //     const patternJSON = await result.json();

    //     patternDataList = patternJSON;
    //     // pattern data is loaded, use it
    //     handlePatternUsage();
    // } catch (error) {
    //     console.error(error);
    // }

    patternDataList = JSONPatternData;
    handlePatternUsage();
}

// Since the apttern data is loaded asynchronously, we only want to
// be using it on those pages where each function is required.
function handlePatternUsage() {
    patternCategories();
    handleMobileView();
    enableSearch();
    searchHandler();


    // not elif because i find this easier to read.
    if (window.location.pathname.endsWith('index.html')) {
        populateSections();
    }

    if (window.location.pathname.endsWith('pattern_overview.html')) {
        // the key of the java object is used for page navigation,
        // so the next page knows what object key to lookup.
        // insightful doc on how to use search params
        // https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams
        let patternKey = new URLSearchParams(document.location.search).get("pattern");
        enterCrochetMode(patternKey);
        populateOverviewData(patternKey);
        patternGalleryThumbStitching();

        // page title to the name of the current patterns
        document.title = patternDataList[patternKey]["name"];
    }

    if (window.location.pathname.endsWith("crochet_mode.html")) {
        let patternKey = new URLSearchParams(document.location.search).get("pattern");

        // index the step to zero;
        let step = Number(new URLSearchParams(document.location.search).get("step"));

        document.title = patternDataList[patternKey]["name"];

        // pass along only this pattern - others irrelevant
        const patternData = patternDataList[patternKey];

        // for indexing substeps rounds, later used for highlight.
        // had issue where substep_round_counter was passed as copy, not reference. The solution by "pointy" solved my issue:
        // https://stackoverflow.com/questions/7744611/pass-variables-by-reference-in-javascript
        let countercontext = { substep_round_counter: 0 };

        populateCModeNav(patternKey, patternData, step);
        populateSubSteps(patternKey, patternData, step, countercontext)
        activateHighlightControl(countercontext, patternKey, step);
        enableExit(patternKey);
        handleMobileCrochetView();
    }

    if (window.location.pathname.endsWith("contact.html")) {
        handleContactForm();
    }

    if (window.location.pathname.endsWith("add_yarn.html")) {
        handleAddYarnForm();
    }

    if (window.location.pathname.endsWith("add_pattern.html")) {
        handleAddPattern();
        addStepListener();
        addMaterialListener();
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
    // loadComponent('navbar', 'js/navbar.html');
    // loadComponent('footer', 'js/footer.html');

    // if you have a server, uncomment above, comment out below
    const navbar = document.getElementById('navbar');
    const footer = document.getElementById('footer');

    navbar.innerHTML = `
        <!-- This is not a full HTML document with correct tags etc., as it is a snipped being loaded into a <nav> tag on each page. -->
        <div class="nav_static">
            <div id="site_nav_logo" onclick="goHome()">
                <img src="images/crochetcache_logogram_text.png" alt="">
            </div>
            <form id="search_form">
                <input
                    id="search_bar"
                    type="text"
                    placeholder="Search..."
                >
            </form>
        </div>
        <ul class="horizontal_list site_control_bar">
            <li>
                <a href="add_pattern.html" id="add_pattern_button" class="button_look">Add Pattern</a>
            </li>
            <li>
                <a href="yarn_catalogue.html" class="button_look" id="my_yarn_button">
                    <img src="images/crochetcache_logogram.png" alt="">
                    <span>My Yarn</span>
                </a>
            </li>
        </ul>
        <buton class="button_look hamburger" id="hamburger">
            <i class="hamburger_patty"></i>
            <i class="hamburger_patty"></i>
            <i class="hamburger_patty"></i>
        </buton>

    `;

    footer.innerHTML = `
        <div class="footer_logo" onclick="goHome()">
            <img src="./images/crochetcache_logogram_text.png" alt="">
        </div>
        <ul id="footer_navigation" class="horizontal_list">
            <li><a href="contact.html">Contact</a></li>
            <li><a href="support.html">Support</a></li>
            <li><a href="about.html">About</a></li>
        </ul>

    `;
}

// Clicking the site logo in the navigation bar takes you to the home Page
// added to button with onclick since the button is attached to the page later
function goHome() {
    window.location.href = "index.html";
}

/**
* Ensure that the mobile_menu_main class is toggled on the navbar when the
* hamburger is clicked
*/
function handleMobileView() {
    const hamburger = document.getElementById("hamburger");
    const navbar = document.getElementById("navbar");
    hamburger.addEventListener('click', () => {
        navbar.classList.toggle("mobile_menu_main");
        console.log("hi")
    });
}

/**
* Disable default behaviour, and send back to the previous page the user was on.
*/
function handleAddPattern() {
    const add_pattern_form = document.getElementById("add_yarn_form");
    add_pattern_form.addEventListener('submit', (event) => {
        event.preventDefault();
        history.back();
        alert("Pattern Added!");
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
        const title = document.createElement('h1');
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
* Create a new card for each element in category_patterns,
* and append them to the parent container parent as passed by reference.
* @param {*} category_patterns This ought to be an array containing pattern Objects
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

/**
* Handle taking the search and navigating to that page.
* delegate functionality to searchHandler(); which checks if there is a search
* in url
*/
function enableSearch() {
    const input = document.getElementById("search_bar");
    const search_form = document.getElementById("search_form");

    search_form.addEventListener('submit', (event) => {
        event.preventDefault();
        const search_value = input.value;

        window.location.href = `index.html?search=${search_value}`;
    });
}

/**
* This function is there so that upon a search being entered users are taken to
* the index page with search parameters,
* if those are detected with this handler, then a search is initiated,
* and the index page appropriately transformed to reflect this.
*/
function searchHandler() {
    let results = [];
    // recover url search parameters
    const search_value = new URLSearchParams(document.location.search).get("search");

    if (search_value) {
        console.log("search was, ", search_value)

        // Remove the normal explore patterns view.
        // only hide if it is there, e.g., search from search
        const pattern_groups = document.getElementById("pattern_groups");
        const secondary_nav = document.getElementById("pattern_category_labels");
        if (pattern_groups) {
            pattern_groups.style.display = "none";
        }
        // hide pattern category labels of index page
        if (secondary_nav) {
            secondary_nav.style.display = "none";
        }

        // Prepare for the results
        // add a parent for search results to go into.
        const index_main = document.getElementById("index_main");

        const if_search_present = document.getElementById("search");
        let search = null;
        let search_results_parent = null;

        // there exists a search (on that page).
        if (if_search_present) {
            search = if_search_present;
            search.innerHTML = "<!-- Populated via JS -->"; // clear old search

            // crate new list for searches to be attached to
            search_results_parent = createSearchesContainer(search, index_main);
            // index_main.appendChild(search); // in case want to add surely
        } else {
            search = document.createElement("div");
            search.id = "search";
            search_results_parent = createSearchesContainer(search, index_main);
        }

        // fetch matches to search query
        // Also MDN is amazing, and JS to an extent, they just have a pre-append
        // function there to use already!
        // https://developer.mozilla.org/en-US/docs/Web/API/Element/prepend
        results = obtainSearchResults(search_value);
        if (results.length != 0) {
            const results_header = document.createElement("h1");
            results_header.textContent = `Results for "${search_value}"...`;
            search.prepend(results_header);
            sectionAddCards(search_results_parent, results);
        } else {
            const no_results_header = document.createElement("h1");
            // if no results, allow for the page to not be tiny,
            // space as same if there were results there.
            const no_result_peudocontent = document.createElement("span");
            no_result_peudocontent.classList.add("no_result_pseudocontent");

            no_results_header.textContent = "No patterns found...";
            search.prepend(no_results_header, no_result_peudocontent);
        }
    }
}

/**
* Go through the list of patterns and return a list of objects which will be
* populated into the search results container div with sectionAddCards();
* Query is what we are looking for in a pattern.
@returns Array with whole pattern Objects
*/
function obtainSearchResults(query) {
    let results = [];
    query = query.toLowerCase();

    const addToResults = (entry) => {
        if (!results.includes(entry)) {
            results.push(entry);
        }
    }

    // Go through all patterns and match their name, overview and categories to
    // the search term
    Object.entries(patternDataList).forEach((returnArray) => {
        // const key = returnArray[0];
        const patternEntry = returnArray[1];
        // cast all to lowercase for better matching
        if (patternEntry["name"].toLowerCase().includes(query)) {
            addToResults(patternEntry);
        } else if (patternEntry["overview"].toLowerCase().includes(query)) {
            addToResults(patternEntry);
        } else if (patternEntry["category"][0].toLowerCase().includes(query)) {
            // check foremost category
            addToResults(patternEntry);
        }
    });

    return results;
}

/**
* Creates a container for searches, which may contain the exit button,
* and also the div which is responsible for holding all the result cards.
* @param {*} search the overall parent of the search functionality.
* @param {*} index_main The overarching parent for the idex page
* @returns A HTML object which is a populated div with searches and exit btn.
*/
function createSearchesContainer(search, index_main) {
    // create search exit button
    const search_exit = document.createElement("a");
    search_exit.id = "search_exit_button";
    search_exit.classList.add("button_look", "button_grey");
    search_exit.innerHTML = `
        <span class="button_text_icon">&#10005;</span>
    `;
    search_exit.addEventListener('click', (event) => {
        event.preventDefault(); // dont act as an anchor actually.
        // upon exit button click, go back, if nothing then go index
        if (history.length < 1) {
            window.location.href = "index.html";
        } else {
            history.back();
        }
    });

    // crate new list for searches
    const search_results_parent = document.createElement('div');
    search_results_parent.id = "search_results";
    search_results_parent.innerHTML = "<!-- Populated via JS -->";

    search.appendChild(search_exit);
    search.appendChild(search_results_parent);
    index_main.appendChild(search);
    return search_results_parent;
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
        window.location.href = `crochet_mode.html?pattern=${destination}&step=0`;
    });
}

/**
* Populate the overview page with data extracted from the datalist with
* the patternKey key.
*/
function populateOverviewData(patternKey) {
    const patternData = patternDataList[patternKey];

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

/**
*
* @param {*} patternDataList
*/
function populateCModeNav(patternKey, patternData, step_index) {

    // i wish JS had types - this was a pain till found you can make a number
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number
    // user sees the non zero-indexed steps
    const user_step_index = 1 + Number(step_index);

    const title = document.getElementById("crochet_step_pattern_title");
    const step_title = document.getElementById("crochet_step_title");
    const previous_step_button = document.getElementById("crochet_step_back");
    const next_step_button = document.getElementById("crochet_step_forward");

    const localsteps = patternData["steps"];

    // Make sure step_index is within how many there are
    const step_name = localsteps[step_index]["title"];

    title.innerText = patternData["name"];
    // reindex step for user view
    step_title.innerText = user_step_index + ": " + step_name;

    previous_step_button.addEventListener('click', () => {
        window.location.href = `crochet_mode.html?pattern=${patternKey}&step=${calculatePreviousStep(step_index)}`
    });
    next_step_button.addEventListener(('click'), () => {
        window.location.href = `crochet_mode.html?pattern=${patternKey}&step=${calculateNextStep(step_index, localsteps)}`
    });
}

/**
* Calculate previous step index.
* @param {*} index the string version of the current step
* @returns Int version of previous step index
*/
function calculatePreviousStep(index) {
    index = Number(index);
    if (index < 0 || index === 0) {
        return 0;
    } else if (index >= 1) {
        return (index - 1);
    } else {
        console.error("Some previous step calculation error occured")
    }
}

/**
* Calculate the index of the next step to be completed.
* @param {*} index the string version of the current step
*/
function calculateNextStep(index, steparray) {
    index = Number(index);
    if (index < 0) {
        return 0
    } else if (index >= 0) {
        const next_index = index + 1;
        // only index if there is a next
        return (next_index <= (steparray.length - 1)) ? next_index : index;
    } else {
        console.error("Some next step error occured")
    }
}


/**
* Create all the sub components for each substep and attach them to a parent.
* @param {*} patternKey Pattern object key in list.
* @param {*} patternData The data for the pattern for which to generate subs.
* @param {*} step the index of the current pattern step.
*/
function populateSubSteps(patternKey, patternData, step, countercontext) {

    const pattern_steps = patternData["steps"][step]["substeps"];

    const substeps_parent_container = document.getElementById("substeps");

    // build and attach substep section for every one
    // adding text node solved the multiple parts of the titles
    // span https://developer.mozilla.org/en-US/docs/Web/API/Document/createTextNode
    pattern_steps.forEach((substep, index) => {

        const parent = document.createElement('section');
        parent.classList.add("substep");
        parent.id = "substep-" + index;

        // create the title section
        const title = document.createElement('span');
        title.classList.add("substep_title");
        const title_index = document.createElement("b");
        // index for user eyes
        title_index.textContent = (Number(step) + 1) + "." + (index + 1) + " ";
        title.appendChild(title_index);
        const title_text = document.createTextNode(substep["title"])
        title.appendChild(title_text)
        parent.appendChild(title);

        // create the content section with rounds and images
        const substep_content = document.createElement('div');
        substep_content.classList.add('substep_content');
        const substep_rounds = document.createElement("div");
        substep_rounds.classList.add("substep_rounds");
        populateSubstepRounds(countercontext, substep, substep_rounds);
        // image gallery
        const substep_images = document.createElement('div');
        substep_images.classList.add("substep_images");
        populateSubstepImages(substep, substep_images);

        substep_content.appendChild(substep_rounds);
        substep_content.appendChild(substep_images);
        parent.appendChild(substep_content);

        substeps_parent_container.appendChild(parent);
    });
}

/**
* Populate all of the rounds that are associated with each substep.
* @param {*} substep The object containing all substep information
* @param {*} parent The parent node to attack the rounds to.
*/
function populateSubstepRounds(countercontext, substep, parent) {
    const instructions = substep["instructions"];

    instructions.forEach((instruction, index) => {
        const round = document.createElement('p');
        round.classList.add("round");
        round.id = `round-${countercontext.substep_round_counter}`;
        countercontext.substep_round_counter++;

        round.textContent = instruction;

        parent.appendChild(round)
    });
}

/**
* Populate the substep images section.
* @param {*} substep The object containing all substep information
* @param {*} parent The parent node to attach the images to.
*/
function populateSubstepImages(substep, parent) {
    const images = substep["images"];

    images.forEach(image => {
        const substep_image = document.createElement('img');
        substep_image.src = image["src"];
        substep_image.alt = image["alt"];

        parent.appendChild(substep_image);
    });
}

/**
* Highlight the requisite substep rounds of the pattern.
* Queries localstorage to see if this has been set for each step of a pattern,
* allowing for persistance across refreshes.
* Uses localstorage to retain pattern progress:
* thanks to MDN for refreshing knowledge of this
* https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage
*/
function activateHighlightControl(countercontext, patternKey, step) {
    const up = document.getElementById("highlight_up");
    const down = document.getElementById("highlight_down");
    const roundsMaxIndex = countercontext.substep_round_counter;

    // If not already set, then retrieve and re-highlight on refresh
    // the progress for the pattern based on patternKey
    let highlight_count = 0;

    const pattern_key_step = (patternKey + "-" + step);
    if (localStorage.getItem(pattern_key_step)) {
        highlight_count = localStorage.getItem(pattern_key_step);
        refreshHighlight(highlight_count);
    } else {
        localStorage.setItem(pattern_key_step, 0);
    }

    up.addEventListener('click', () => {
        console.log(localStorage.getItem(pattern_key_step))

        if (highlight_count >= 1) {
            highlight_count--;
        }
        if (0 <= highlight_count <= roundsMaxIndex) {
            const round = document.getElementById(`round-${highlight_count}`);
            round.classList.remove("round_complete")
        }
        localStorage.setItem(pattern_key_step, highlight_count);
    });

    down.addEventListener('click', () => {
        console.log(localStorage.getItem(pattern_key_step))

        if (0 <= highlight_count <= roundsMaxIndex) {
            const round = document.getElementById(`round-${highlight_count}`);
            round.classList.add("round_complete")
        }
        if (highlight_count < (roundsMaxIndex - 1)) {
            highlight_count++;
        }
        localStorage.setItem(pattern_key_step, highlight_count);
    });
}

/**
* Reapply the highlight for steps of a particular pattern up to index upTo.
* @param {*} upTo The index of round to which the round_complete
** class (highlight) should be applied.
*/
function refreshHighlight(upTo) {
    console.log("up to => ", upTo)
    for (i = 0; i < upTo; i++) {
        const round = document.getElementById(`round-${i}`);
        round.classList.add("round_complete")
    }
}

/**
* Enable the exit button on the crochet mode page.
* make the navbar visible again
*/
function enableExit(pattern) {
    const exit_button = document.getElementById("crochet_mode_exit");
    const navbar = document.getElementById("navbar");

    exit_button.addEventListener('click', () => {
        window.location.href = `pattern_overview.html?pattern=${pattern}`
        navbar.classList.remove("nav_hidden");
    })
}

/**
* Hide the navigation bar when teh screen is below 750px,
* this value was arrived at through visual testing.
*/
function handleMobileCrochetView() {
    // want to be able to get screen size from JS
    // MDN had a useful document for this:
    // https://developer.mozilla.org/en-US/docs/Web/API/Screen/width
    const screenWidth = window.screen.width;
    const navbar = document.getElementById("navbar");
    if (screenWidth < 750) {
        navbar.classList.add("nav_hidden");
    }
}
// ============================================================================
//
// Contact Page
//
// ============================================================================

/**
* Handle the event listener for submitting a contact form,
* deals with the validation message and preventing default.
*
* HTML thankfully has an API already for checking email and form validity,
* allows me to simply tap into it.
* https://developer.mozilla.org/en-US/docs/Web/API/HTMLSelectElement/checkValidity
*/
function handleContactForm() {
    const contact_form = document.getElementById("send-message");
    contact_form.addEventListener('submit', (event) => {
        event.preventDefault();

        const status = document.getElementById('submit_status');

        if (contact_form.checkValidity()) {
            status.textContent = "Message Sent!";
            status.classList.add("form_success");
        } else {
            status.textContent = "Message not sent!";
            status.classList.add("form_failure");
        }
    });
}

// ============================================================================
//
// Yarn Catalogue Page
//
// ============================================================================

let yarnData = null;
/**
* Load in the yarn data from a json file.
* Store data in the yarnData array
*/
async function loadYarn() {
    // try {
    //     const result = await fetch('/data/yarn.json');
    //     const yarnJSON = await result.json();

    //     yarnData = yarnJSON;

    //     // pattern data is loaded, use it
    //     handleYarnUsage();
    // } catch (error) {
    //     console.error(error);
    // }

    yarnData = JSONYarnData;
    handleYarnUsage();
}

/**
* Make sure on the yarn catalogue page.
* Then delegate what to do with the data.
*/
function handleYarnUsage() {
    if (window.location.pathname.endsWith('yarn_catalogue.html')) {
        populateYarnTable();
        handleAddYarn();
    }
}

/**
* Populate the table on the yarn catalogue page with the data from the
* yarn JSON file.
*/
function populateYarnTable() {
    const table_body = document.getElementById("yarn_tbody");

    console.log("yarnd ata")
    Object.entries(yarnData).forEach((yarnObj) => {
        console.log(yarnObj[0])

        const yarnKey = yarnObj[0];
        const yarnData = yarnObj[1];

        const row = document.createElement("tr");
        row.id = yarnKey + "_row"

        const yarn_preview = document.createElement('img');
        yarn_preview.src = yarnData["preview"];
        yarn_preview.classList.add("yarn_preview_image")
        yarn_preview.alt = "Photo of " + yarnData["name"];

        // make a td for each eleement, and delegate
        const image = document.createElement('td');
        image.id = yarnKey + "_image";
        image.classList.add("image_cell");
        image.appendChild(yarn_preview);

        const colour_block = document.createElement('td');
        colour_block.id = yarnKey + "_colourblock";
        colour_block.style.backgroundColor = yarnData["color"];
        colour_block.classList.add("yarn_colour_block");

        const colour_name = document.createElement('td');
        colour_name.textContent = yarnData["colour_name"];

        const name = document.createElement('td');
        name.textContent = yarnData["name"];

        const weight = document.createElement('td');
        weight.textContent = yarnData["weight"];

        const material = document.createElement('td');
        material.textContent = yarnData["material"];

        const quantity = document.createElement('td');
        quantity.textContent = yarnData["quantity"];

        const remove_button = document.createElement("button");
        remove_button.classList.add("button_look", "remove_yarn_button");
        remove_button.textContent = "Delete"
        // do not run immediately, run function to run
        remove_button.onclick = () => {
            row.remove();
        };

        const remove = document.createElement('td');
        remove.appendChild(remove_button);

        row.append(image, colour_block, colour_name, name, weight, material, quantity, remove);

        table_body.appendChild(row);
    })
}


/**
* Remove a row from the yarn catalogue table,
* Code also to remove it from the file if need be.
* @param {*} key The key of the yarn element to remove
*/
function removeYarn(key) {
    const object = document.getElementById(key + "_row");
    object.remove(object);
}

/**
* Add an event listener to the add yarn button and link to the correct page.
*/
function handleAddYarn() {
    const add_button = document.getElementById("add_yarn_button");
    add_button.addEventListener('click', () => {
        window.location.href = "add_yarn.html";
    });
}

/**
* Disable default behaviour, and take users back to the main page,
* that they came from.
*/
function handleAddYarnForm() {
    const form = document.getElementById("add_yarn_form");

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        alert("Yarn Added!")
        window.location.href = "yarn_catalogue.html?form=success"
    });

}


// ============================================================================
//
// Add Pattern Page
//
// ============================================================================

/**
* Event listener on button which adds another step section to the add pattern page:
*/
function addStepListener() {
    let index = 2;
    const add_step = document.getElementById("add_step");
    const steps_parent = document.getElementById("pattern_steps");
    add_step.addEventListener('click', () => {
        step_child = document.createElement("div");
        step_child.innerHTML = `
            <h2>Step ${index}</h2>
            <input
                required
                type="text"
                class="form_input"
                placeholder="Title">
            <textarea
                required
                name="step_instructions"
                id="step_instructions"
                class="form_input"
                placeholder="Instructions..."
            ></textarea>
            <input
                type="file"
                placeholder="Images"
            >
            `;
        step_child.classList.add("step_child");
        steps_parent.appendChild(step_child);
        index++;
    })
}

/**
* Allow users to append more materials to a new pattern.
*/
function addMaterialListener() {
    const add_materia_button = document.getElementById("add_materia_button");
    const materials_parent = document.getElementById("materials_parent");
    add_materia_button.addEventListener('click', () => {
        material_girl = document.createElement("div");
        material_girl.innerHTML = `
            <div class="section_inline section_together">
                <input
                    type="text"
                    placeholder="Title"
                    class="form_input small_input">
                <input
                    type="text"
                    placeholder="..."
                    class="form_input small_input">
            </div>
            `;
        material_girl.classList.add("step_child");
        materials_parent.appendChild(material_girl);
    })
}


// ============================================================================
//
// DATA
//
// ============================================================================
// This has been added to avoid any permissions issues with using fetch,
// as I dont know whether you will be using a local server to provide the projects - if you do then the fetch and json file code will work.
// As this isn't guaranteed, the JSON data will be loaded from these two variables here.
// if you wish to try this:
// * patterns - then un-comment lines 22 - 32, and comment out 33-34.
// * yarn - un-comment 865 - 875, comment out 877 -878
// the same goes for code on lines 146-147, comment out he code below that.



JSONPatternData = {
    "cat-bag": {
        "name": "Cat Pattern Tote Bag",
        "blurb": "A super strong cotton tote bag with a perfect back intarsia cat graphic on the front.",
        "overview": "A super strong cotton tote bag with a perfect back intarsia cat graphic on the front. This pattern will take a long time to complete.",
        "category": [
            "Popular Patterns",
            "Tote Bag",
            "Cat",
            "Intarsia"
        ],
        "hero-image": {
            "src": "./images/cat-bag-0.jpeg",
            "alt": "Two people holding a red and a blue tote bag with cat patterns."
        },
        "images": [
            {
                "src": "./images/cat-bag-1.jpeg",
                "alt": "Person holding an orange tote bag with a black cat on it."
            }
        ],
        "pattern_details": {
            "needles": [
                "2.5 mm"
            ],
            "tools": [
                "Threading needle",
                "Scissors"
            ],
            "abbreviations": "US",
            "materials": [
                "Extra yarn"
            ],
            "complexity": "Difficult"
        },
        "yarn": [
            {
                "name": "Dutch Orange Mayflower Yarn",
                "material": "Mercerised Cotton",
                "quantity_skeins": 3
            },
            {
                "name": "Natural White Mayflower Yarn",
                "material": "Mercerised Cotton",
                "quantity_skeins": 2
            },
            {
                "name": "Black Mayflower Yarn",
                "material": "Mercerised Cotton",
                "quantity_skeins": 1
            }
        ],
        "steps": [
            {
                "title": "Create the cat graphic",
                "substeps": [
                    {
                        "title": "Begin the bottom row",
                        "instructions": [
                            "Using the white yarn",
                            "SC 85 x 16, slst, rotate"
                        ],
                        "images": []
                    },
                    {
                        "title": "Complete the middle",
                        "instructions": [
                            "Make 3 spools of white yarn, and 3 of the black",
                            "SC till the first tail section is there, then switch to black for x stitches, then swithc the white",
                            "Repeat for each paw"
                        ],
                        "images": []
                    }
                ]
            },
            {
                "title": "Stitch together the sides",
                "substeps": [
                    {
                        "title": "Stitch the sides",
                        "instructions": [
                            "Using the needle and extra orange yarn, stitch the two halves of the tote together"
                        ],
                        "images": [
                            {
                                "src": "./images/cat-bag-2.jpeg",
                                "alt": "One half of an intarsia pattern of a black cat."
                            }
                        ]
                    }
                ]
            }
        ]
    },
    "rose-bunch": {
        "name": "Bunch of Roses",
        "blurb": "A bouquet of red roses.",
        "overview": "A beautiful bouquet of red roses, perfect for a meaningful valentines gift or to decorage a room / study.",
        "category": [
            "Popular Patterns",
            "Flowers",
            "Fine-crochet"
        ],
        "hero-image": {
            "src": "./images/rose-bunch-0.png",
            "alt": "Bunch of three red crochet roses held in hand."
        },
        "images": [
            {
                "src": "./images/rose-bunch-1.jpeg",
                "alt": "single rose help in hand"
            },
            {
                "src": "./images/rose-bunch-2.png",
                "alt": "Bunch of roses held in hand"
            },
            {
                "src": "./images/rose-bunch-3.png",
                "alt": "Crochet rose next to a ruler"
            },
            {
                "src": "./images/rose-bunch-4.jpeg",
                "alt": "Crochet rose crown, unstitched"
            }
        ],
        "pattern_details": {
            "needles": [
                "2.5mm"
            ],
            "tools": [
                "Threading Needle",
                "Scissors"
            ],
            "abbreviations": "UK",
            "materials": [
                "Metal Wire",
                "Silver Wire",
                "Extra yarn"
            ],
            "complexity": "Medium-Difficult"
        },
        "yarn": [
            {
                "name": "Red Fuchsia",
                "material": "Wool",
                "quantity_skeins": 1
            },
            {
                "name": "Garden Green",
                "material": "Wool",
                "quantity_skeins": 1
            }
        ],
        "steps": [
            {
                "title": "Create the Crown",
                "substeps": [
                    {
                        "title": "Crochet the Crown",
                        "instructions": [
                            "mc 6",
                            "slst",
                            "(sc 3, inc) x 6"
                        ],
                        "images": [
                            {
                                "src": "./images/rose-bunch-4.jpeg",
                                "alt": "Crochet rose crown, unstitched"
                            }
                        ]
                    }
                ]
            }
        ]
    },
    "goose-bag": {
        "name": "Goose Bag",
        "blurb": "A goose shaped bag for the goose-pods",
        "overview": "",
        "category": [
            "Popular Patterns",
            "Tote Bag",
            "Amigurumi"
        ],
        "hero-image": {
            "src": "./images/goose-bag-0.png",
            "alt": "placeholder"
        },
        "images": [
            {
                "src": "./images/placeholder.png",
                "alt": "placeholder"
            }
        ],
        "pattern_details": {
            "needles": [
                ""
            ],
            "tools": [
                ""
            ],
            "abbreviations": "",
            "materials": [
                ""
            ],
            "complexity": ""
        },
        "yarn": [
            {
                "name": "",
                "material": "",
                "quantity_skeins": 1
            }
        ],
        "steps": [
            {
                "title": "",
                "substeps": [
                    {
                        "title": "",
                        "instructions": [
                            "mc 6",
                            "slst",
                            "(sc 3, inc) x 6"
                        ],
                        "images": [
                            {
                                "src": "./images/placeholder.png",
                                "alt": "Placeholder"
                            }
                        ]
                    }
                ]
            }
        ]
    },
    "tulip-bunch": {
        "name": "Bunch of Tulips",
        "blurb": "Featuring intricate inner petals and stamens.",
        "overview": "",
        "category": [
            "Flowers",
            "Fine-crochet"
        ],
        "hero-image": {
            "src": "./images/tulip-bunch-0.png",
            "alt": "Photo of crochet tulips"
        },
        "images": [
            {
                "src": "./images/placeholder.png",
                "alt": "placeholder"
            }
        ],
        "pattern_details": {
            "needles": [
                ""
            ],
            "tools": [
                ""
            ],
            "abbreviations": "",
            "materials": [
                ""
            ],
            "complexity": ""
        },
        "yarn": [
            {
                "name": "",
                "material": "",
                "quantity_skeins": 1
            }
        ],
        "steps": [
            {
                "title": "",
                "substeps": [
                    {
                        "title": "",
                        "instructions": [
                            "mc 6",
                            "slst",
                            "(sc 3, inc) x 6"
                        ],
                        "images": [
                            {
                                "src": "./images/placeholder.png",
                                "alt": "Placeholder"
                            }
                        ]
                    }
                ]
            }
        ]
    },
    "goose-pods": {
        "name": "GOOSEPODS",
        "blurb": "The perfect home for your airpods",
        "overview": "",
        "category": [
            "Popular Patterns",
            "Amigurumi",
            "Fine-crochet"
        ],
        "hero-image": {
            "src": "./images/goose-pods-0.png",
            "alt": "Photo of goose pods"
        },
        "images": [
            {
                "src": "./images/placeholder.png",
                "alt": "placeholder"
            }
        ],
        "pattern_details": {
            "needles": [
                ""
            ],
            "tools": [
                ""
            ],
            "abbreviations": "",
            "materials": [
                ""
            ],
            "complexity": ""
        },
        "yarn": [
            {
                "name": "",
                "material": "",
                "quantity_skeins": 1
            }
        ],
        "steps": [
            {
                "title": "",
                "substeps": [
                    {
                        "title": "",
                        "instructions": [
                            "mc 6",
                            "slst",
                            "(sc 3, inc) x 6"
                        ],
                        "images": [
                            {
                                "src": "./images/placeholder.png",
                                "alt": "Placeholder"
                            }
                        ]
                    }
                ]
            }
        ]
    },
    "capy-parent": {
        "name": "Capybara Parent",
        "blurb": "Concrete - its name",
        "overview": "",
        "category": [
            "Amigurumi"
        ],
        "hero-image": {
            "src": "./images/capy-parent-0.png",
            "alt": "Photo of crochet capybara parent"
        },
        "images": [
            {
                "src": "./images/placeholder.png",
                "alt": "placeholder"
            }
        ],
        "pattern_details": {
            "needles": [
                ""
            ],
            "tools": [
                ""
            ],
            "abbreviations": "",
            "materials": [
                ""
            ],
            "complexity": ""
        },
        "yarn": [
            {
                "name": "",
                "material": "",
                "quantity_skeins": 1
            }
        ],
        "steps": [
            {
                "title": "",
                "substeps": [
                    {
                        "title": "",
                        "instructions": [
                            "mc 6",
                            "slst",
                            "(sc 3, inc) x 6"
                        ],
                        "images": [
                            {
                                "src": "./images/placeholder.png",
                                "alt": "Placeholder"
                            }
                        ]
                    }
                ]
            }
        ]
    },
    "capy-baby": {
        "name": "Capybara Baby",
        "blurb": "Cement & Concrete",
        "overview": "",
        "category": [
            "Amigurumi"
        ],
        "hero-image": {
            "src": "./images/capy-baby-0.png",
            "alt": "Photo of crochet capybara parent and baby"
        },
        "images": [
            {
                "src": "./images/placeholder.png",
                "alt": "placeholder"
            }
        ],
        "pattern_details": {
            "needles": [
                ""
            ],
            "tools": [
                ""
            ],
            "abbreviations": "",
            "materials": [
                ""
            ],
            "complexity": ""
        },
        "yarn": [
            {
                "name": "",
                "material": "",
                "quantity_skeins": 1
            }
        ],
        "steps": [
            {
                "title": "",
                "substeps": [
                    {
                        "title": "",
                        "instructions": [
                            "mc 6",
                            "slst",
                            "(sc 3, inc) x 6"
                        ],
                        "images": [
                            {
                                "src": "./images/placeholder.png",
                                "alt": "Placeholder"
                            }
                        ]
                    }
                ]
            }
        ]
    }
};

JSONYarnData = {
    "ninja-green": {
        "name": "Green Ninja Cotton Yarn",
        "preview": "./images/ninja_green.png",
        "color": "#4c803d",
        "colour_name": "Dark Green",
        "weight": "4/4",
        "material": "Cotton",
        "quantity": 3
    },
    "ninja-ornge": {
        "name": "Orange Ninja Cotton Yarn",
        "preview": "./images/ninja_orange.png",
        "color": "#f7902f",
        "colour_name": "Orange",
        "weight": "4/4",
        "material": "Cotton",
        "quantity": 5
    },
    "woolen-tundra": {
        "name": "Tundra Softness",
        "preview": "./images/tundra_brown.png",
        "color": "#7a5a3c",
        "colour_name": "Dark Brown",
        "weight": "8/4",
        "material": "Wool",
        "quantity": 5
    },
    "finch-white": {
        "name": "Swann White",
        "preview": "./images/finch_white.png",
        "color": "#f5f4ed",
        "colour_name": "Off White",
        "weight": "6/4",
        "material": "Cotton",
        "quantity": 1
    },
    "finch-blue": {
        "name": "Blue Jeans",
        "preview": "./images/finch_blue.png",
        "color": "#508ab3",
        "colour_name": "Jeans Blue",
        "weight": "6/4",
        "material": "Cotton",
        "quantity": 1
    }
};
