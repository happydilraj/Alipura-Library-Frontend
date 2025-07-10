import { useLocation } from 'react-router-dom';

function loadScript(src) {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function Checkout() {
  const location = useLocation();
  const { orderId } = location.state || {}; // Get orderId from the state passed during navigation

  const displayRazorpay = async () => {
    // Load the Razorpay script
    const res = await loadScript('https://checkout.razorpay.com/v1/checkout.js');

    if (!res) {
      alert('Razorpay SDK failed to load. Please check your internet connection.');
      return;
    }

    // Fetch order details from the backend
    try {
      const response = await fetch('http://localhost:1769/razorpay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }), // Pass the `orderId` to the backend
      });

      const data = await response.json();
      console.log('Razorpay Order Details:', data);

      if (!data.id) {
        alert('Failed to fetch order details from the server.');
        return;
      }

      // Razorpay options
      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY || 'rzp_test_yourkey', // Replace with your Razorpay key
        amount: data.amount, // Amount in subunits (e.g., paise)
        currency: data.currency,
        name: 'Acme Corp',
        description: 'Test Transaction',
        image: 'https://example.com/your_logo', // Optional: your company logo
        order_id: data.id, // Razorpay order ID from the backend
        callback_url: 'http://localhost:1769/verify', // Backend endpoint for verifying the payment
        notes: {
          address: 'Razorpay Corporate Office',
        },
        theme: {
          color: '#3399cc',
        },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (error) {
      console.error('Error during Razorpay payment:', error);
      alert('An error occurred while processing your payment. Please try again.');
    }
  };

  return (
    <div className="Checkout">
      <h1>Checkout</h1>
      <button onClick={displayRazorpay}>Pay Now</button>
    </div>
  );
}

export default Checkout;