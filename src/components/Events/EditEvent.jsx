import {
  Link,
  redirect,
  useNavigate,
  useNavigation,
  useParams,
  useSubmit
} from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import Modal from '../UI/Modal.jsx';
import EventForm from './EventForm.jsx';
import { fetchEvent, updateEvent, queryClient } from '../../util/http.js'; //below //what is the query client really?
import ErrorBlock from '../UI/ErrorBlock.jsx';

export default function EditEvent() {
  const navigate = useNavigate();
  const { state } = useNavigation();
  const submit = useSubmit();
  const params = useParams();

  const { data, isError, error } = useQuery({
    queryKey: ['events', params.id], //the query depends on the id we're trying to edit -- 422
    queryFn: ({ signal }) => fetchEvent({ signal, id: params.id }),
    staleTime: 10000 // we're ensuring we delay the fetch for 10 seconds so that we can use the cached data from React Router. This way, we prevent redundant reload or a second refetch from React Query. // find out more about the behaviour from chat
  });

  //PREV REACT QUERY CODE before combination with REACT ROUTER

  // const { mutate } = useMutation({ // mutationFn, onMutate, onError, onSettled are all properties received by useMutation
  //   mutationFn: updateEvent,
  //   onMutate: async (data) => {  // React Query passes the data we pass to mutate below as a value to onMutate. The data has an id propert and an event which we set below(in mutate()) and will now use here
  //     const newEvent = data.event;

  //     await queryClient.cancelQueries({ queryKey: ['events', params.id] }); // necessary to add when performing optimistic updating to prevent clashing queries for the same data --424  IDG
  //     const previousEvent = queryClient.getQueryData(['events', params.id]); // enables us to store and roll back previous data if there was an error. 

  //     queryClient.setQueryData(['events', params.id], newEvent); //key below // optimistic updating below // we make use of this to manipulate the already stored data without or before waiting for a response. -- 424

  //     return { previousEvent }  // why did we have to return this??
  //   },
  //   onError: (error, data, context) => {
  //     queryClient.setQueryData(['events', params.id], context.previousEvent); //we call qC.set... to change data. The next is the key, the particular data // Here we're setting it back to the old data which was previously stored with context.previousEvent 
  //   },
  //   onSettled: () => {  // we use this to be sure we really got the same data in front-end as in backend
  //     queryClient.invalidateQueries(['events', params.id]);
  //   }
  // });

  // function handleSubmit(formData) {
  //   mutate({ id: params.id, event: formData });
  //   navigate('../');  //This takes it up one level to the Event detail page.  
  // }

  function handleSubmit(formData) {
    submit(formData, { method: 'PUT' }); // we're not sending an http request here. 
  }

  function handleClose() {
    navigate('../');
  }

  let content;

  if (isError) {
    content = (
      <>
        <ErrorBlock
          title="Failed to load event"
          message={
            error.info?.message ||
            'Failed to load event. Please check your inputs and try again later.'
          }
        />
        <div className="form-actions" >
          <Link to="../" className="button">
            Okay
          </Link>
        </div>
      </>
    )
  }

  if (data) {
    content = (
      <EventForm inputData={data} onSubmit={handleSubmit}>
        {state === 'submitting' ? (
          <p>Sending data...</p>
        ) : (
          <>
            <Link to="../" className="button-text">
              Cancel
            </Link>
            <button type="submit" className="button">
              Update
            </button>
          </>
        )}
      </EventForm>
    );
  }

  return <Modal onClose={handleClose}>{content}</Modal>
}

//Combining react router and react query

export function loader({ params }) {  // We want react router to execute the code in this function before loading and rendering the component
  return queryClient.fetchQuery({
    queryKey: ['events', params.id],
    queryFn: ({ signal }) => fetchEvent({ signal, id: params.id })
  });
}

export async function action({ request, params }) {  //426
  const formData = await request.formData();
  const updatedEventData = Object.fromEntries(formData);
  await updateEvent({ id: params.id, event: updatedEventData });
  await queryClient.invalidateQueries(['events']);
  return redirect('../');
}

/**
 * --426
 * With fetch query in the loader, React query goes ahead to send the request and store the qresponse data in the cache 
 * When useQuery is executed again in the component, its the cache data that will be used. We want to keep all the advantages that React Query gives us
 * thats why we leave the query there and use the data passed to it from React Router e.g if we leave a window and come back, it re-fetches. we're able to tap into that advantage. 
 * 
 */




/**
 * With optimistic updating we're able to simulate the update without waiiting for the actual update from the backend so if I make an update now for instance, to maybe change my name in a form
 * and I need it to reflect in the UI after making that change, I'd have to wait for it from the backend before it shows and sometimes we might have to leav the page and come back before that update is reflected 
 * in the UI. with optimistic updating, I can manually implement the changes I made and when the actual or similar change arrives from the database, it just replaces it. We also need to do something in case the 
 * request to the backnd fails because then we'd have inconsistent data from the backend.
 * 
 * 
 * // Through query client we can interact with react query and tell it to change the cash data // IDG
 * 
 * queryClient.setQueryData(['events', params.id]);  // It is the data stored by this particular key I want to edit without waiting for the response
 * 
 */