import React, { useEffect, useState } from 'react';
import './Layout.css';
import Header from '../Components/Header/Header';
import Footer from '../Components/Footer/Footer';
import { useGlobalState } from '../Context/globalState';


const Layout = ({ children }) => {

    const { seats, setSeats } = useGlobalState();

    useEffect(() => {
        const FetchAllSeats = async () => {
            try {
                const response = await fetch(`${process.env.REACT_APP_API_URL}/getAllSeats`)

                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }

                const data =  await response.json();
                setSeats(data);
            } catch (error) {
                console.log(error)
            }
        }
        FetchAllSeats();
    },[])

    return (
        <div className="layout">

            <header className="header sticky top-2">
                <Header/>
            </header>

            <main className="main-content">
                {children}
            </main>

            <footer className="footer">
                <Footer/>
                <p>&copy; {new Date().getFullYear()} Dilraj. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default Layout;
