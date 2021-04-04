// Application Dependencies
const express = require('express');
const superagent = require('superagent');
const cors = require('cors');
const pg = require('pg');
require('dotenv').config();

// Application Setup
const app = express();
const PORT = process.env.PORT || 3000;
app.use(cors());
// tell server that all stylesheets inside public 
app.use(express.static(__dirname + '/public'));
// Application Middleware
app.use(express.urlencoded({ extended: true }));
// Set the view engine for server-side templating
app.set('view engine', 'ejs');
// API Routes
// Renders the home page
app.get('/', renderHomePage);
// Renders the search form
app.get('/searches/new', showForm);
// Creates a new search to the Google Books API
app.post('/searches', createSearch);
// Catch-all
app.get('*', (request, response) => response.status(404).send('This route does not exist'));
app.listen(PORT, () => console.log(`Listening on port: ${PORT}`));
// Constructor
let bookArray=[];
function Book(info) {
    const placeholderImage = 'https://i.imgur.com/J5LVHEL.jpg';
    this.title = info.title || 'No title available';
    this.image_url = `https://books.google.com/books/content?id=${info.id}&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api`;
    this.author=info.author || 'No author available';
    this.description=info.description || 'No description available';
    bookArray.push(this);

}
// Note that .ejs file extension is not required
function renderHomePage(request, response) {
    response.render('pages/index');
}
function showForm(request, response) {
    response.render('pages/searches/new');
}
// No API key required
function createSearch(request, response) {
    console.log('creat search called')
    let url = 'https://www.googleapis.com/books/v1/volumes';
    // add the search query to the URL
    const searchBy = request.body.searchBy;
    const searchValue = request.body.search;
    const queryObj = {};
    if (searchBy === 'title') {
        queryObj['q'] = `+intitle:${searchValue}`;
    } else if (searchBy === 'author') {
        queryObj['q'] = `+inauthor:${searchValue}`;
    }
    // send the URL to the servers API
    superagent.get(url).query(queryObj).then(apiResponse => {
        return apiResponse.body.items.map(bookResult => new Book(bookResult.volumeInfo))
    }).then(results => {
        console.log(bookArray);
        response.render('pages/searches/show', { searchResults: bookArray })
    });
}