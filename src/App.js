import './App.css';
import LoginForm from './login';
import RegisterNewUser from './register'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import OtpVerifyForRegistration from './otpNewUser';
import HomePage from './homePage';
import ForgotPassword from './ForgotPassword';
import AdminLoginForm from './Admin';
import AdminDashboard from './Admin_dashboard';
// import GoogleAuth from './GoogleAuth';


function App() {



  return (
    <div>

      <Router>

        <Routes>
          <Route path="/register" element={<RegisterNewUser />} />
          <Route path="/" element={<LoginForm />} />
          <Route path="/otp_verify" element={<OtpVerifyForRegistration />} />
          <Route path="/home_page" element={<HomePage />} />
          <Route path="/forgot_password" element={<ForgotPassword />}></Route>
          {/* <Route path="/home_page/:key" component={HomePage} /> */}

          <Route path="/admin" element={<AdminLoginForm />}></Route>
          <Route path="/admin/dashboard" element={<AdminDashboard />}></Route>
          {/* <Route path="/google" element={<GoogleAuth />}></Route> */}


        </Routes>
      </Router>

    </div>

  );
}

export default App;
