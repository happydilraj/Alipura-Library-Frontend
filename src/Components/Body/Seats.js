// src/Seats.js
import React, { useEffect, useState } from 'react';
import './Seats.css'; // Create a CSS file for styling
import { useGlobalState } from '../../Context/globalState';
import { useNavigate } from 'react-router-dom';

const totalRows = 5; // Define total rows of seats
const seatsPerRow = 10; // Define total seats per row
const ROOT_USER_ID = 'ADCAM6At3lhqydkCD3HVcOOK2sG3';

const Seats = () => {

  const { user, setUser, seats, setSeats } = useGlobalState();
  const [selectedSeat, setSelectedSeat] = useState({ id: 0 , status: "", userId: "", userName: "", userImage: ""});
  const [order_id, setOrder_id] = useState()
  const navigate = useNavigate();


  const handleConfirmSeat = async () => {
    if(user.uid === ""){
      alert("Plese Login first to set the seat.")
      return;
    }

    if (!selectedSeat.id) {
      alert("Please select a seat first.");
      return;
    }

    const isUserHasSeat = seats.find((s) => s.userId === user.uid)
    if(isUserHasSeat){
      alert(`You already have a seat: : ${isUserHasSeat.id} `)
      return;
    }

    // Confirm with the user before changing the seat status
    const isConfirmed = window.confirm(`Are you sure you want to confirm this seat: ${selectedSeat.id}?`);
    if (!isConfirmed) return;

    try {
      const resp = await fetch( `${process.env.REACT_APP_API_URL}/createOrder`, { // Update the URL as needed
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paymentDetails: { amount: 1000, currency: 'INR', receiptNo: 'unique-receipt-id-11'} }),
      });

      if(!resp.ok){
        console.error("Some Error occured!");
        return;
      }
      const order = await resp.json();
      console.log("this is order", order.data)

      navigate('/checkout', { state: { orderId: order.data.id } });
    } catch (error) {
      console.log(error)
    }

    // try {
    //   const resp = await fetch( `${process.env.REACT_APP_API_URL}/reserveSeat`, { // Update the URL as needed
    //       method: 'POST',
    //       headers: {
    //           'Content-Type': 'application/json',
    //       },
    //       body: JSON.stringify({ updatedSeat: selectedSeat, user: user, paymentDetails: { amount: 1000, currency: 'INR', receiptNo: 'unique-receipt-id-11'} }),
    //   });
    //   if(!resp.ok){
    //     console.error("Some Error occured!");
    //     return;
    //   }

    //   const response = await resp.json();

    //   // Update the selected seat's status to "occupied"
    //   setSeats((prevSeats) =>
    //     prevSeats.map((seat) =>
    //       seat.id === selectedSeat.id ? { ...seat, status: "occupied", userId: user.uid, userName: user.name, userImage: user.image} : seat
    //     )
    //   );

    // } catch (error) {
    //   console.log(error)
    // }

    // // Optionally, clear the selected seat from user state if no longer needed
    // setSelectedSeat({ id: 0, status: "", userId: "", userName: "", userImage: ""});
    // alert(`Seat ${selectedSeat.id} has been confirmed.`);
  };

  const handleAddAllSeats = async () => {
    const initialSeats = [];
    let seatNumber = 1;
    for (let i = 0; i < totalRows * seatsPerRow; i++) {
      initialSeats.push({
        id: seatNumber++,
        status: 'vacant',
        userId: "",
        userName: "",
        userImage: ""
      });
    }
    setSeats(initialSeats);
    
    try {
      const response = await fetch( `${process.env.REACT_APP_API_URL}/saveAllSeats`, { // Update the URL as needed
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId: user.uid, seats: initialSeats }),
      });
      console.log("this is response", response)
    } catch (error) {
      console.log(error)
    }
  }

  const handleDeleteAllSeats = async () => {
    try {
      const response = await fetch( `${process.env.REACT_APP_API_URL}/deleteAllSeats`, { // Update the URL as needed
          method: 'DELETE',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId: user.uid }),
      });
      console.log("this is response", response)
    } catch (error) {
      console.log(error)
    }
  }

  // Function to handle seat selection
  const toggleSeat = (seatId) => {
    const seat = seats.find((s) => s.id === seatId);
    if (seat.status === 'occupied') {
      alert('This seat is occupied and cannot be selected.');
      return;
    }
    setSelectedSeat(seat); // Set the selected seat if it's vacant
  };

  // Generate seat layout
  const renderSeats = () => {
    const seatComponents = seats.map((seat) => (
      <div
        key={seat.id}
        className={`seat ${selectedSeat.id === seat.id ? 'selected' : ''} ${seat.status === 'occupied' ? 'occupied' : ''}`}
        onClick={() => toggleSeat(seat.id)}
      >
        {seat.id}
      </div>
    ));

    // Split seats into rows
    const rows = [];
    for (let i = 0; i < totalRows; i++) {
      rows.push(
        <div key={`row-${i}`} className="row">
          {seatComponents.slice(i * seatsPerRow, (i + 1) * seatsPerRow)}
        </div>
      );
    }
    return rows;
  };

  return (
    <>
    <div className="seating-chart">
      <h2 style={{ marginBottom: '20px'}}>Select Your Seat</h2>
      <div className="seats-container">{renderSeats()}</div>
      <div className="selected-seats">
        <h3>Selected Seat:</h3>
        <p>{ selectedSeat.id || 'None'}</p>
      </div>
      <div>
        <button type="button" onClick={handleConfirmSeat} className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mt-6 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800">Confirm Seat</button>
      </div>

      {/* For owner only */}
      {
        (user.uid === ROOT_USER_ID) &&
      
        <div className='float-right'>
          <button type="button" onClick={handleAddAllSeats} className="text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mt-6 mb-2 dark:bg-red-600 dark:hover:bg-red-700 focus:outline-none dark:focus:ring-red-800">Add All Seats</button>
          <button type="button" onClick={handleDeleteAllSeats} className="text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mt-6 mb-2 dark:bg-red-600 dark:hover:bg-red-700 focus:outline-none dark:focus:ring-red-800">Delete All Seats</button>
        </div>
      }
    </div>

    {order_id && <form method="POST" action="https://api.razorpay.com/v1/checkout/embedded">
      <input type="hidden" name="key_id" value="rzp_test_ziN98G5ISprlLo"/>
      <input type="hidden" name="amount" value={1001}/>
      <input type="hidden" name="currency" value="INR"/>
      <input type="hidden" name="order_id" value={order_id}/>
      <input type="hidden" name="name" value="Acme Corp"/>
      <input type="hidden" name="description" value="A Wild Sheep Chase"/>
      <input type="hidden" name="image" value="https://cdn.razorpay.com/logos/BUVwvgaqVByGp2_large.jpg"/>
      <input type="hidden" name="prefill[name]" value="Gaurav Kumar"/>
      <input type="hidden" name="prefill[contact]" value="9123456780"/>
      <input type="hidden" name="prefill[email]" value="gaurav.kumar@example.com"/>
      <input type="hidden" name="notes[shipping address]" value="L-16, The Business Centre, 61 Wellfield Road, New Delhi - 110001"/>
      <input type="hidden" name="callback_url" value="https://example.com/payment-callback"/>
      <input type="hidden" name="cancel_url" value="https://example.com/payment-cancel"/>
      <button>Submit</button>
    </form>
    }
    </>
  );
};

export default Seats;
