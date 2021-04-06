DROP TABLE IF EXISTs books ;
CREATE TABLE books(
    id SERIAL PRIMARY KEY,
    author VARCHAR(200),
    title VARCHAR(200),
    isbn VARCHAR(200),
    image_url VARCHAR(200),
    description VARCHAR(10000)
);