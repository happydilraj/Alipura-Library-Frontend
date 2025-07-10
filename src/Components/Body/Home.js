import React, { useState, useEffect, useRef } from 'react';
import './Home.css'; // Add styles here
import ElectricityImage from '../../assets/Electricity.jpg'
import InternetImage from '../../assets/Internet.webp'
import AirconditionerImage from '../../assets/Airconditioner.avif'
import SilenceImage from '../../assets/Silence.webp'
import LowcostImage from '../../assets/Lowcost.avif'
import RightImage from '../../assets/Right.png'
import LeftImage from '../../assets/Left.png'

const quotes = ['The man who does not read books has no advantage over the one who cannot read them.', 'Education is the passport to the future, for tomorrow belongs to those who prepare for it today.', 'Teachers can open the door, but you must enter it yourself.', 'The beautiful thing about learning is that no one can take it away from you.', 'Education is the most powerful weapon you can use to change the world.']

const Home = () => {
  
  const scrollContainerRef = useRef(null);
  const [currentQuote, setCurrentQuote] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [scrollRight, setScrollRight] = useState(true);

  const q = 'The man who does not read books has no advantage over the one who cannot read them.'

  const toggleScroll = () => {
    if (scrollContainerRef.current) {
      const containerWidth = scrollContainerRef.current.clientWidth; // Get the container width
      
      // Scroll based on the current direction
      scrollContainerRef.current.scrollBy({ left: scrollRight ? containerWidth / 2 : -containerWidth / 2, behavior: 'smooth' });
      
      // Toggle the scroll direction
      setScrollRight(!scrollRight);
    }
  };

  useEffect(() => {
    const handleTyping = () => {
      const fullText = quotes[currentIndex];
      

        // Typing animation
        setCurrentQuote((prev) => prev + fullText.charAt(charIndex));
        setCharIndex((prev) => prev + 1);
        
        // If the quote is fully typed, wait before starting deletion
        if (charIndex === fullText.length - 1) {
          setTimeout(() => {
            setCharIndex(0);
            setCurrentQuote('')
            setCurrentIndex((prev) => (prev + 1) % quotes.length);
          }, 2000); // Pause before deleting
        }
      } 
    

    const typingSpeed = 75; // Adjust typing and deleting speed
    const timer = setTimeout(handleTyping, typingSpeed);

    return () => clearTimeout(timer); // Cleanup on unmount
  }, [charIndex, currentQuote, currentIndex]);

  return (
    <div>
      <div className="quote-carousel">
        <p className="quote-text">{currentQuote}</p>
      </div>
      
      <div>

      <div className='facilities flex gap-5 items-center' ref={scrollContainerRef}
        style={{
          overflowX: 'auto', // Enable horizontal scrolling
          overflowY: 'hidden', // Hide vertical scrollbar if it appears
          scrollbarWidth: 'none', // For Firefox
          msOverflowStyle: 'none', // For Internet Explorer and Edge
        }}
      >

      <div className="max-w-sm bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700" style={{ flex: '0 0 400px' }}>
          <div className="image-container">
              <img height={500} width={500} className="rounded-t-lg" src={ElectricityImage} alt="Electricity Image" />
          </div>
          <div className="p-5">
              <h5 className="facilities-header mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white text-center"> 24 ✕ 7 Electricity</h5>
              <p className="mb-3 font-normal text-gray-700 dark:text-gray-400 ">We provide uninterrupted electricity supply around the clock, ensuring that your power needs are met at any time of day or night. Our reliable service guarantees that you can operate without interruptions, supporting your activities and enhancing your quality of life.
              </p>
          </div>
      </div>

      <div className="max-w-sm bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700" style={{ flex: '0 0 400px' }}>
          <div className="image-container">
              <img height={500} width={500} className="rounded-t-lg" src={InternetImage} alt="Internet Image" />
          </div>
          <div className="p-5">
              <h5 className="facilities-header mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white text-center">Unlimited Internet</h5>
              <p className="mb-3 font-normal text-gray-700 dark:text-gray-400 ">Enjoy seamless connectivity with our unlimited internet plans. Experience fast and reliable internet service that keeps you connected to what matters most, whether you're streaming, working, or browsing. Say goodbye to data caps and hello to uninterrupted online experiences!</p>
          </div>
      </div>

      <div className="max-w-sm bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700" style={{ flex: '0 0 400px' }}>
          <div className="image-container">
              <img className="rounded-t-lg" src={AirconditionerImage} alt="Airconditioner Image" />
          </div>
          <div className="p-5">
              <h5 className="facilities-header mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white text-center">Fully Air Conditioned</h5>
              <p className="mb-3 font-normal text-gray-700 dark:text-gray-400 ">Experience comfort in every corner with our fully air-conditioned facilities. Enjoy a pleasant and refreshing environment, no matter the season. Our advanced air conditioning systems ensure optimal temperature control, allowing you to work, relax, and thrive in a cool atmosphere.</p>
          </div>
      </div>

      <div className="max-w-sm bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700" style={{ flex: '0 0 400px' }}>
          <div className="image-container">
              <img className="rounded-t-lg" src={SilenceImage} alt="Silence Image" />
          </div>
          <div className="p-5">
              <h5 className="facilities-header mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white text-center">Peaceful Environment</h5>
              <p className="mb-3 font-normal text-gray-700 dark:text-gray-400 ">Enjoy a serene and tranquil atmosphere designed to enhance productivity and relaxation. Our peaceful environment is free from distractions. Whether you are working, studying, or simply unwinding, experience the perfect setting for peace of mind and creativity.</p>
          </div>
      </div>

      <div className="max-w-sm bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700" style={{ flex: '0 0 400px' }}>
          <div className="image-container">
              <img className="rounded-t-lg" src={LowcostImage} alt="Lowcost Image" />
          </div>
          <div className="p-5">
              <h5 className="facilities-header mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white text-center">Monthly affordable prices</h5>
              <p className="mb-3 font-normal text-gray-700 dark:text-gray-400 ">Experience quality services at monthly rates that won't break the bank. Our pricing plans are designed to be budget-friendly while delivering exceptional value. Enjoy flexibility and convenience without compromising on the quality of your experience.</p>
          </div>
      </div>

      </div>

      <button 
        onClick={toggleScroll}
        className='mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 float-right flex items-center'>
        Show More <img style={{ height: '25px', width: "25px"}} src= {scrollRight ? RightImage : LeftImage} />
      </button>

      </div>
    </div>
  )
}

export default Home