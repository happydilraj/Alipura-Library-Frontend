import About from "./Components/Body/About";
import Home from "./Components/Body/Home";
import Students from "./Components/Body/Students";
import Seats from "./Components/Body/Seats";
import Layout from "./layout/Layout";
import Login from "./Components/Header/Login";
import Signup from "./Components/Header/Signup";
import Checkout from "./Components/Body/Checkout"
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";


function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/students" element={<Students />} />
          <Route path="/seats" element={<Seats />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/checkout" element={<Checkout />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
