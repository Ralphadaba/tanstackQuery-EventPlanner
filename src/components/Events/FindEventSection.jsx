import { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { fetchEvents } from '../../util/http.js';
import LoadingIndicator from '../UI/LoadingIndicator';
import ErrorBlock from '../UI/ErrorBlock.jsx';
import EventItem from './EventItem.jsx';

export default function FindEventSection() {
  const searchElement = useRef();
  const [searchTerm, setSearchTerm] = useState() //we need to cause the component to reload after the form is submitted(we make use of useRef to hold it till then) ... 412

  const { data, /*isPending*/ isLoading, isError, error } = useQuery({  //check below for isLoading vs isPending
    queryKey: ['events', { searchTerm: searchTerm }],
    //queryFn: ({ signal }) => fetchEvents({ signal, searchTerm }),  // listen attentively to vd 413 to understand this --413   //we want to fetch events tat match our search term as opposed to all events.
    queryFn: ({ signal, queryKey }) => fetchEvents({ signal, ...queryKey[1] }),    // queryKey[1] is accessing the { searchTerm: searchTerm } so its not redundant -- 425
    enabled: searchTerm !== undefined   // deeper meanings check vd-- 414 and practice to master  //this ensures that it remains enabled even when a user clears the input
  });

  function handleSubmit(event) {
    event.preventDefault();
    setSearchTerm(searchElement.current.value);
  }

  let content = <p>Please enter a search term and to find events.</p>

  if (isLoading) {
    content = <LoadingIndicator />
  }

  if (isError) {
    content = (
      <ErrorBlock
        title="An error occured"
        message={error.info?.message}
      />
    );
  }

  if (data) {
    content = (
      <ul className="events-list">
        {data.map((event) => (
          <li key={event.id}>
            <EventItem event={event} />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <section className="content-section" id="all-events-section">
      <header>
        <h2>Find your next event!</h2>
        <form onSubmit={handleSubmit} id="search-form">
          <input
            type="search"
            placeholder="Search events"
            ref={searchElement}
          />
          <button>Search</button>
        </form>
      </header>
      {content}
    </section>
  );
}


/**
 * React Query considers the query to be "pending" until it is actually executed(data has arrived), regardless of whether it is enabled or not.
 *  On the other hand, isLoading only turns true when the query actually starts fetching for the first time, and since the fetch was disabled 
 * (enabled: false), it never entered that initial loading state.
 * 
 * Is pending is literally saying I'm waiting for the data while isLoading is saying I'm fetching the data
 * 
 */