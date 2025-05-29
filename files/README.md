# Overview
This project is a website for delivering crochet patterns stored in JSON to users with a more unified design, as long as the pattern is stored correctly, it will be displayed correctly.
The site gives users basic controls like progress control (add class to specific id number, increment number with button), saving progress (store number in localstorage), and a dark mode implemented in css by checking the system preferred mode.

---
# File structure
## `/` - root
The root folder is where the page files are stored and accessed.


## `/js`
All javascript functionality is contained in this directory, under a single `script.js` file.
This file has a number of functions. Docs have been provided to some degree to attempt to explain what the nest of worms does.
In essence, it works by checking that the dom is loaded, once it is the page wide functions are run, and the asynchronous data loading functions. Since use of the data occurs in that asynchronous fashion, these functions call a handler to deal with the data and delegate where (by checking url) it is used. The handlers delegate to a number of populator functions which load the data into HTML objects to be displayed to the user on the right page.

## `/images`
The project images: logo, pattern image data, etc.. All images that are used are stored in this one location.

## `/css`
This directory contains all the styles, in the `styles.css` file. It has been divided into sections per page, with some styles that are re-used being shared.

## `/data`
The data directory is responsible for hosting all of the JSON data which is loaded with the functions into the pages
