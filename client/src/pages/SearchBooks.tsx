import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import {
  Container,
  Col,
  Form,
  Button,
  Card,
  Row
} from 'react-bootstrap';

import Auth from '../utils/auth';
import { useMutation } from '@apollo/client';
import { SAVE_BOOK } from '../graphql/mutations'; // Import the SAVE_BOOK mutation
import { getSavedBookIds, saveBookIds, removeBookId } from '../utils/localStorage'; // Import localStorage helpers
import { searchGoogleBooks } from '../utils/API';
import type { Book } from '../models/Book';
import type { GoogleAPIBook } from '../models/GoogleAPIBook';

const SearchBooks = () => {
  // create state for holding returned google api data
  const [searchedBooks, setSearchedBooks] = useState<Book[]>([]);
  // create state for holding our search field data
  const [searchInput, setSearchInput] = useState('');

  // create state to hold saved bookId values
  const [savedBookIds, setSavedBookIds] = useState(getSavedBookIds());

  // set up useEffect hook to save `savedBookIds` list to localStorage on component unmount
  useEffect(() => {
    return () => saveBookIds(savedBookIds);
  });

  // useMutation hook for saving the book
  const [saveBookMutation] = useMutation(SAVE_BOOK, {
    onCompleted: (data) => {
      console.log('Book saved:', data);
    },
    onError: (err) => {
      console.error('Error saving book:', err);
    },
  });

  // create method to search for books and set state on form submit
  const handleFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!searchInput) {
      return false;
    }

    try {
      const response = await searchGoogleBooks(searchInput);

      if (!response.ok) {
        throw new Error('something went wrong!');
      }

      const { items } = await response.json();

      const bookData = items.map((book: GoogleAPIBook) => ({
        bookId: book.id,
        authors: book.volumeInfo.authors || ['No author to display'],
        title: book.volumeInfo.title,
        description: book.volumeInfo.description,
        image: book.volumeInfo.imageLinks?.thumbnail || '',
      }));

      setSearchedBooks(bookData);
      setSearchInput('');
    } catch (err) {
      console.error(err);
    }
  };

  // create function to handle saving a book to our database
  const handleSaveBook = async (bookId: string) => {
    // find the book in `searchedBooks` state by the matching id
    const bookToSave = searchedBooks.find((book) => book.bookId === bookId);
  
    // Ensure that bookToSave is defined before proceeding
    if (!bookToSave) {
      console.error('Book not found!');
      return;
    }
  
    // get token
    const token = Auth.loggedIn() ? Auth.getToken() : null;
  
    if (!token) {
      return false;
    }
  
    try {
      // Execute the mutation to save the book
      await saveBookMutation({
        variables: {
          bookId: bookToSave.bookId,
          authors: bookToSave.authors,
          description: bookToSave.description,
          title: bookToSave.title,
          image: bookToSave.image,
          link: bookToSave.link, // Include link if applicable
        },
      });
  
      // If book successfully saves to user's account, save book id to state
      setSavedBookIds([...savedBookIds, bookToSave.bookId]);
    } catch (err) {
      console.error('Error saving book:', err);
    }
  };


  const handleRemoveBook = (bookId: string) => {
    // Remove the book from localStorage
    if (removeBookId(bookId)) {
      // Update the savedBookIds state with the correct type for prevSavedBookIds
      setSavedBookIds((prevSavedBookIds: string[]) => prevSavedBookIds.filter((id) => id !== bookId));
    }
  };

  return (
    <>
      <div className="text-light bg-dark p-5">
        <Container>
          <h1>Search for Books!</h1>
          <Form onSubmit={handleFormSubmit}>
            <Row>
              <Col xs={12} md={8}>
                <Form.Control
                  name="searchInput"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  type="text"
                  size="lg"
                  placeholder="Search for a book"
                />
              </Col>
              <Col xs={12} md={4}>
                <Button type="submit" variant="success" size="lg">
                  Submit Search
                </Button>
              </Col>
            </Row>
          </Form>
        </Container>
      </div>
  
      <Container>
        <h2 className="pt-5">
          {searchedBooks.length
            ? `Viewing ${searchedBooks.length} results:`
            : 'Search for a book to begin'}
        </h2>
        <Row>
          {searchedBooks.map((book) => {
            return (
              <Col md="4" key={book.bookId}>
                <Card border="dark">
                  {book.image ? (
                    <Card.Img
                      src={book.image}
                      alt={`The cover for ${book.title}`}
                      variant="top"
                    />
                  ) : null}
                  <Card.Body>
                    <Card.Title>{book.title}</Card.Title>
                    <p className="small">Authors: {book.authors}</p>
                    <Card.Text>{book.description}</Card.Text>
                    {Auth.loggedIn() && (
                      <>
                        {/* Save Book Button */}
                        <Button
                          disabled={savedBookIds?.some(
                            (savedBookId: string) => savedBookId === book.bookId
                          )}
                          className="btn-block btn-info"
                          onClick={() => handleSaveBook(book.bookId)}
                        >
                          {savedBookIds?.some(
                            (savedBookId: string) => savedBookId === book.bookId
                          )
                            ? 'This book has already been saved!'
                            : 'Save this Book!'}
                        </Button>
  
                        {/* Remove Book Button */}
                        <Button
                          className="btn-block btn-danger mt-2"
                          onClick={() => handleRemoveBook(book.bookId)}
                        >
                          Remove this Book
                        </Button>
                      </>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>
      </Container>
    </>
  );
};

export default SearchBooks;