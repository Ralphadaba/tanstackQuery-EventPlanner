import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Link, Outlet, useNavigate, useParams } from 'react-router-dom';

import Header from '../Header.jsx';
import { fetchEvent, deleteEvent, queryClient } from '../../util/http.js';
import ErrorBlock from '../UI/ErrorBlock.jsx';
import Modal from '../UI/Modal.jsx';


export default function EventDetails() {
  const [isDeleting, setIsDeleting] = useState(false);

  const { id } = useParams();   // or const params =  useParams();
  const navigate = useNavigate();

  const { data, isPending, isError, error } = useQuery({
    queryKey: ['events', id], // or ['events', {id: params.id}]  // 1--['events', 5]  2-- ['events', id:5]. With the second, we're just passig an identifier to the id, would still wok if we just pass the id
    queryFn: ({ signal }) => fetchEvent({ id, signal })  // or ({ id: params.id, signal: signal })  // in here, we're ASSIGNING the values to the function so it's just like the reference values thingy //  inside an object, every value must have a key.
  });

  const {
    mutate,
    isPending: isPendingDeletion,  //Alias: This is JS where when using object destructuring, we can asign an alias to one of those properties we're pulling out of the objet by assigning a column after the original property name and a new name -- 421 // idg
    isError: isErrorDeleting,
    error: deleteError,
  } = useMutation({
    mutationFn: deleteEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['events'],        //below
        refetchType: 'none'  // below  // this ensures that the pages are rendered stale but not re-executed until when we navigate to it again below.
      });
      navigate('/events');
    }
  });

  function handleStartDelete() {
    setIsDeleting(true);
  }

  function handleStopDelete() {
    setIsDeleting(false);
  }

  function handleDelete() {
    mutate({ id });  //mutate({ id: id }) or mutate({ id: params.id })  //we're basically updating or replacing the function with values like the reference values thingy
  }

  let content;

  if (isPending) {
    content = (
      <div id="event-details-content" className="center">
        <p>Fetching event data...</p>
      </div>
    );
  }

  if (isError) {
    content = (
      <div id="event-details-content" className="center">
        <ErrorBlock
          title="Failed to load event"
          message={
            error.info?.message ||
            'Failed to fetch event data, please try again later.'
          }
        />
      </div>
    );
  }

  if (data) {
    const formattedDate = new Date(data.date).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    content = (
      <>
        <header>
          <h1>{data.title}</h1>
          <nav>
            <button onClick={handleStartDelete}>Delete</button>
            <Link to="edit">Edit</Link>
          </nav>
        </header>
        <div id="event-details-content">
          <img src={`http://localhost:3000/${data.image}`} alt={data.title} />
          <div id="event-details-info">
            <div>
              <p id="event-details-location">{data.location}</p>
              <time dateTime={`Todo-DateT$Todo-Time`}>{formattedDate} @ {data.time}</time>
            </div>
            <p id="event-details-description">{data.description}</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {isDeleting && (
        <Modal onClose={handleStopDelete}>
          <h2>Are you sure?</h2>
          <p>Do you really want to delete this event? This action cannot be undone.</p>
          <div className="form-actions">
            {isPendingDeletion && <p>Deleting, please wait...</p>}
            {!isPendingDeletion && (
              <>
                <button onClick={handleStopDelete} className="button-text">
                  Cancel
                </button>
                <button onClick={handleDelete} className="button">
                  Delete
                </button>
              </>
            )}
          </div>
          {isErrorDeleting && (
            <ErrorBlock
              title="Failed to delete event"
              message={
                deleteError.info?.message ||
                'Failed to delete event, please try again later.'
              }
            />
          )}
        </Modal>
      )}
      <Outlet />
      <Header>
        <Link to="/events" className="nav-item">
          View all Events
        </Link>
      </Header>
      <article id="event-details">
        {content}
      </article>
    </>
  );
}



/**
 * refetchType: 'none'  //we delete an event, call a refetch of all events then navigate to a different page. when we invalidat... and call a refetch,
 * we are still on the event Detail page which we currently deleted and are calling a refetch on that deleted page as well. 
 * so react query goes ahead to refetch all queries including the eventDetailPage we are on. this makes sure that once you call invalidateQueries, 
 * the existing queries will not automatically be triggered again immediately.
 * 
 * If you invalidate a query like queryClient.invalidateQueries(['events']), all queries with a key starting with 'events' will be marked as stale and automatically refetch if they're active.
 * So, if you used ['events', id], invalidating ['events'] would also invalidate it because ['events', id] shares 'events' as part of its key.
 * 
 */