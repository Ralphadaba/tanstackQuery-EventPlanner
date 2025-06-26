import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';   // As opposed to useQuery that gets data, useMutation SEND data i.e. a POST request. 

import Modal from '../UI/Modal.jsx';
import EventForm from './EventForm.jsx';
import { createNewEvent } from '../../util/http.js';
import ErrorBlock from '../UI/ErrorBlock.jsx';
import { queryClient } from '../../util/http.js';

export default function NewEvent() {
  const navigate = useNavigate();

  const { mutate, isPending, isError, error } = useMutation({   // mutate --415  // with the mutate function, you tell it exactly when to send the request. 
    mutationFn: createNewEvent,
    onSuccess: () => {  //417  // we want to navigate after a successful data fetch and not after we click the creat button(which is the case with just using navigate without onSuccess) 
      queryClient.invalidateQueries({ queryKey: ['events'] }); //417 //This tells react query that the data fetched by certain queries is outdated at this point and should be marked as stale and a refetch should be triggered as such. --417
      navigate('/events');
    }
  });

  function handleSubmit(formData) {
    mutate({ event: formData });      //this ensures that I'm sending the data to my backend. 
  }

  return (
    <Modal onClose={() => navigate('../')}>
      <EventForm onSubmit={handleSubmit}>
        {isPending && 'Submitting...'}
        {!isPending && (
          <>
            <Link to="../" className="button-text">
              Cancel
            </Link>
            <button type="submit" className="button">
              Create
            </button>
          </>
        )}
      </EventForm>
      {isError && (
        <ErrorBlock
          title="Failed to create event"
          message={
            error.info?.message ||
            'Failed to create event. Please check your inputs and try again later.'
          }
        />
      )}
    </Modal>
  );
}



/**
 *  queryClient.invalidateQueries({queryKey: ['events']}); //This tells react query that the data fetched by certain queries is outdated at this point and should be marked as stale and a refetch should be triggered as such. --417
 * This will ensure that the responsible query for a particular section is re-executed so that we can see the updated refetch or the newly added data on the UI. If we leave the page and come back it'll 
 * actually show (because react query re-executes everytime user leaves and comes back to a page ) but it isn't good user experience. 
 * 
 * It receives a queryKey which helps to identify the particular query that should be marked stale and re-rendered. 
 * 
 */