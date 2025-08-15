import './App.css';
import LoginForm from './login';
import RegisterNewUser from './register'
import Navbar from './Navbar';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import OtpVerifyForRegistration from './otpNewUser';
import HomePage from './homePage';

function App() {



  return (
    <div>
      
    <Router>

      <Routes>

        <Route path="/register" element={<RegisterNewUser />} />
        <Route path="/" element={<LoginForm />} />
        <Route path="/otp_verify" element={<OtpVerifyForRegistration/>} />
        <Route path="/home_page" element={<HomePage />} />



      </Routes>
    </Router>
    </div>

  );
}

export default App;
