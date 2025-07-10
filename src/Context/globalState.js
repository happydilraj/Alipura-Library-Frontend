import React, { createContext, useState, useContext, useEffect } from 'react';

const GlobalStateContext = createContext();

const totalRows = 5; // Define total rows of seats
const seatsPerRow = 10; // Define total seats per row

export const GlobalStateProvider = ({ children }) => {

    const [user, setUser] = useState({
       uid: "",
       email: ""
    })
    // State to keep track of selected seats
  const [seats, setSeats] = useState(() => {
    // Initialize seats with id and status
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
    return initialSeats;
  });

  return (
    <GlobalStateContext.Provider value={{ user, setUser, seats, setSeats }}>
      {children}
    </GlobalStateContext.Provider>
  );
};

export const useGlobalState = () => useContext(GlobalStateContext);