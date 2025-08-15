import axios from 'axios';
import React, { useContext, useState } from 'react';
import OtpVerifyForRegistration from './otpNewUser';
import LoginForm from './login';
import HomePage from './homePage';
import { useAppContext } from "./AppContext";
import { useNavigate } from 'react-router-dom';



const RegisterNewUser = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const {baseUrl}=useAppContext();
  const [otpForm, setOtpForm] = useState(false);
  const [isLoginPageOpen, setIsLoginPageOpen] = useState(false);

        const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prevData) => ({
      ...prevData,
      [name]: value
    }));
  };
  const clearFormData = (e) => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: ''
    });

  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.confirmPassword !== formData.password) {
      alert("Passwords do not match");
      return;
    }
    if (formData.name === '' || formData.email === '' || formData.password === '' || formData.phone === '' || formData.confirmPassword === '') {
      alert("Please Enter All required field");
    }
    else {

      try {
     

        const response = await axios.post(baseUrl+'register_new_user', {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          headers: {
            'Content-Type': 'application/json'
          }
        }
        );
        console.log(response);
        if (response.data.Status) {
          alert(response.data.Message);
          setOtpForm(true);
          navigate("/otp_verify");
          clearFormData();

        }
        alert(response.data.Message);



      } catch (error) {
        console.error('Error:', error);
        alert("Something went wrong");
      }
    }

  };
  const openLoginPage = () => {

    setIsLoginPageOpen(true);
    navigate("/login");

  }

  return (
    <div align="center">
      {!otpForm && !isLoginPageOpen && < h2 align="center">Register</h2>}

      {!otpForm && !isLoginPageOpen && <div style={{ height: "315px", width: "400px", margin: 'auto', backgroundColor: 'gray', borderRadius: '12px' }}>

        <form onSubmit={handleSubmit}  align="left" >
          <label>Name:</label><br />
          <input name="name" value={formData.name} onChange={handleChange} required /><br />

          <label>Email:</label><br />
          <input type="email" name="email" value={formData.email} onChange={handleChange} required /><br />

          <label>Phone:</label><br />
          <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required /><br />

          <label>Password:</label><br />
          <input type="password" name="password" value={formData.password} onChange={handleChange} required /><br />

          <label>Confirm Password:</label><br />
          <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required /><br />
          <div align="center">
            <br />
            <button type="submit" style={{

              backgroundColor: 'skyblue',
              borderRadius: '10px'
            }}  >Register</button>       <button onClick={openLoginPage}>Login</button>
          </div>
        </form>
      </div>
      }

      <div>
        {isLoginPageOpen && <LoginForm />}
        {otpForm && <OtpVerifyForRegistration />}


      </div>
    </div>
  );
};

export default RegisterNewUser;
