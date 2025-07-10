import React, { useState } from 'react'
import logo from '../../assets/logo.png'
import './Header.css'
import { useNavigate } from 'react-router-dom';
import userImage from '../../assets/user.png'
import { useGlobalState } from '../../Context/globalState';

const Navbar = () => {

  const { user, setUser } = useGlobalState()
  const [selectedButton, setSelectedButton] = useState('home'); // Default no button selected
  const navigate = useNavigate(); // Initialize useNavigate
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const toggleDropdown = () => {
        setIsDropdownOpen((prev) => !prev);
    };

    const handleLogout = async () => {
        try {
            const response = await fetch( `${process.env.REACT_APP_API_URL}/logout`, { // Update the URL as needed
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            setUser({ uid: "", email: "" })
            navigate('/');
        } catch (error) {
            console.error('Error during Logout:', error);
        }
    }

  // Function to handle button click and update state
  const handleButtonClick = (buttonName) => {
    setSelectedButton(buttonName); 

    if (buttonName === 'home') {
        navigate('/');
    }
    else if(buttonName === 'about'){
        navigate('/about');
    }
    else if(buttonName === 'students'){
        navigate('/students');
    }

    else if(buttonName === 'seats'){
        navigate('/seats')
    }

    else if(buttonName === 'login'){
        navigate('/login')
    }

  };


  return (
    <div className='h-20 flex justify-between'>
        {/* left div */}
        <div className='flex p-2  self-start'>
            <img src={logo} alt='logo' height={50} width={50} className='mr-5'/>
            <div className='flex flex-col'>
                <span className='h-3/4 text-xl'>Government Library</span>
                <span className='h-1/4 text-xs text-right -mt-3'>Alipura</span>
            </div>
        </div>

        {/* middle div */}
        <div className='mx-auto my-auto'>
            {/* Home Button */}
            <button
                type="button"
                onClick={() => handleButtonClick('home')}
                className={`text-white hover:text-white border border-gray-800 hover:bg-[#010822] focus:outline-none font-medium rounded-lg text-sm px-5 py-2.5 text-center me-5 mb-2 dark:border-gray-600 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-600 ${
                selectedButton === 'home' ? 'selected' : 'focus:ring-gray-300'
                }`}
            >
                Home
            </button>

            {/* About Button */}
            <button
                type="button"
                onClick={() => handleButtonClick('about')}
                className={`text-white hover:text-white border border-gray-800 hover:bg-[#010822] focus:outline-none font-medium rounded-lg text-sm px-5 py-2.5 text-center me-5 mb-2 dark:border-gray-600 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-600 ${
                selectedButton === 'about' ? 'selected' : 'focus:ring-gray-300'
                }`}
            >
                About
            </button>

            {/* Our Students Button */}
            <button
                type="button"
                onClick={() => handleButtonClick('students')}
                className={`text-white hover:text-white border border-gray-800 hover:bg-[#010822] focus:outline-none font-medium rounded-lg text-sm px-5 py-2.5 text-center me-5 mb-2 dark:border-gray-600 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-600 ${
                selectedButton === 'students' ? 'selected' : 'focus:ring-gray-300'
                }`}
            >
                Our Students
            </button>

            {/* Seats Button */}
            <button
                type="button"
                onClick={() => handleButtonClick('seats')}
                className={`text-white hover:text-white border border-gray-800 hover:bg-[#010822] focus:outline-none font-medium rounded-lg text-sm px-5 py-2.5 text-center me-5 mb-2 dark:border-gray-600 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-600 ${
                selectedButton === 'seats' ? 'selected' : 'focus:ring-gray-300'
                }`}
            >
                Seats
            </button>
            </div>

        {/* right div */}
        <div className="ml-auto my-auto mr-4">
            {user.uid !== "" ? (
                <div className="relative inline-block">
                    <button
                        id="dropdownUserAvatarButton"
                        onClick={toggleDropdown}
                        className="flex text-sm rounded-full md:me-0"
                        type="button"
                    >
                        <img
                            src={userImage}
                            alt="user avatar"
                            style={{ height: '30px', width: '30px'}}
                        />
                    </button>

                    {isDropdownOpen && (
                        <div
                            id="dropdownAvatar"
                            className="z-10 right-0 bg-white w-[6rem] dark:bg-gray-700 dark:divide-gray-600 mt-2 absolute"
                        >
                            <div>
                                <button
                                    onClick={() => {
                                        setIsDropdownOpen(false);
                                        handleLogout();
                                    }}
                                    className="w-full p-2 text-left text-sm text-gray-700 hover:text-white hover:bg-gray-500 dark:hover:bg-gray-600 dark:text-gray-200 dark:hover:text-white"
                                >
                                    Sign out
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <button
                    onClick={() => handleButtonClick('login')}
                    type="button"
                    className="text-white hover:text-white border border-gray-800 hover:bg-[#010822] focus:ring-4 focus:outline-none focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2 dark:border-gray-600 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-600 dark:focus:ring-gray-800"
                >
                    Login
                </button>
            )}
        </div>
    </div>
  )
}

export default Navbar