// Application Dependencies
const express = require('express');
const superagent = require('superagent');
const cors = require('cors');
const pg = require('pg');
require('dotenv').config();

// Application Setup
const app = express();
const PORT = process.env.PORT || 5000;
const DATABASE_URL=process.env.DATABASE_URL;
app.use(cors());
// tell server that all stylesheets inside public 
app.use(express.static(__dirname + '/public'));
// Application Middleware
app.use(express.urlencoded({ extended: true }));

// Database Setup
const client = new pg.Client(DATABASE_URL);

client.on('error', err => console.error(err));
// Set the view engine for server-side templating
app.set('view engine', 'ejs');
// API Routes
// Renders the home page
app.get('/', renderHomePage);
// Renders the search form
app.get('/searches/new', showForm);
// Creates a new search to the Google Books API
app.post('/searches', createSearch);

app.get('*', (request, response) => response.status(404).send('This route does not exist'));
app.post('/books', addBook);
app.get('/books/:book_id', bookDetails);


// Constructor
let bookArray=[];
function Book(info) {
    const placeholderImage = 'https://i.imgur.com/J5LVHEL.jpg';
    this.title = info.title || 'No title available';
    this.image_url = info.imageLinks? info.imageLinks.thumbnail:'https://i.imgur.com/J5LVHEL.jpg';
    this.author=info.authors || 'No author available';
    this.description=info.description || 'No description available';
    bookArray.push(this);

}
// Note that .ejs file extension is not required
function renderHomePage(request, response) {
    console.log('render home called');
    let selectBooks = 'SELECT id, author, title, isbn, image_url, description FROM books;';
  client.query(selectBooks).then(result => {
      console.log(result);
    response.render('pages/index', { booksList: result.rows, booksCount: result.rows.length });
  });
}

function showForm(request, response) {
    response.render('pages/searches/new');
}
// No API key required
function createSearch(request, response) {
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



function addBook (request, response){
    const {author, title, isbn, image_url, description} = request.body;
    const insertedBook = 'INSERT INTO books (author, title, isbn, image_url, description) VALUES($1,$2,$3,$4,$5);';
    const safeValues = [author, title, isbn, image_url, description];
    client.query(insertedBook,safeValues).then(() => {
      response.status(200).redirect('/');
    }).catch(handleError);
  }


  
function bookDetails(request, response) {
    const selectedBook = 'SELECT * FROM books WHERE id=$1';
    const safeValues = [request.params.book_id];
    client.query(selectedBook, safeValues).then(data => {
      response.render('pages/books/show', {
        book: data.rows[0]
      });
    }).catch(handleError);
  }

// Connect to DB and Start the Web ServerF
client.connect().then(() => {
    app.listen(PORT, () => {
        console.log("Connected to database:", client.connectionParameters.database)
        console.log('Server up on', PORT);
    });
})

function handleError(error, response) {
    response.render('pages/error-view', { error: error });
  }