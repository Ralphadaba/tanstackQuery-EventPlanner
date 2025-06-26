import { useQuery } from '@tanstack/react-query';

import LoadingIndicator from '../UI/LoadingIndicator.jsx';
import ErrorBlock from '../UI/ErrorBlock.jsx';
import EventItem from './EventItem.jsx';
import { fetchEvents } from '../../util/http.js';

export default function NewEventsSection() {
  const { data, isPending, isError, error } = useQuery({   //the 'data' is the response data returned from the fetch function
    queryKey: ['events', {max: 3}],   // for max -- 425    //This will be used by tanstack query to cache (explanation below) the data... vd 410
    //queryFn: ({signal}) => fetchEvents({signal, max: 3 }), //with this property, we define the actual code that wil send the request -- 410
    queryFn: ({signal, queryKey}) => fetchEvents({signal, ...queryKey[1]}), // queryKey[1] is accessing the {max:3} so its not redundant -- 425    //with this property, we define the actual code that wil send the request -- 410
    staleTime: 5000,    // below  --411
    // gcTime: 30000 
  });

  let content;

  if (isPending) {
    content = <LoadingIndicator />;
  }

  if (isError) {
    content = (
      <ErrorBlock title="An error occurred" message={error.info?.message || 'Failed to fetch events.'}
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
    <section className="content-section" id="new-events-section">
      <header>
        <h2>Recently added events</h2>
      </header>
      {content}
    </section>
  );
}


/**
 * Tanstack query reacts to us leaving a page and coming back to it. It reloads a page when we leave it and come back to it. 
 * It also helps with caching. with regular fetching, we'd have to reload whenever we leave a page. With caching, we can leave 
 * the page and come back to the previous data fetched from cache instantly
 * Cache it's basically a temporary store for data to be loaded quickly
 * 
 * React query gives us instant results through the cache but also fetches data bts to identify updated data. It then silently 
 * updates the instant data with the updated data. 
 * 
 * staleTime: 0 //You can set the time you want the fetch function to run after the instant data(from cache) has been provided
 * 
 * gcTime: // sets how long the data in the cash will be available. 5 mins default
 * 
 */
