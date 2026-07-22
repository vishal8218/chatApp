import axios from 'axios';
import React, { useState } from 'react';
import OtpVerifyForRegistration from './otpNewUser';
import LoginForm from './login';
import { useAppContext } from "./AppContext";
import { useNavigate } from 'react-router-dom';

const RegisterNewUser = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    latitude: '',
    longitude: ''
  });
  const { baseUrl } = useAppContext();
  const [otpForm, setOtpForm] = useState(false);
  const [isLoginPageOpen, setIsLoginPageOpen] = useState(false);
  const [isRegister,setIsRegister]=useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value
    }));
  };

  const clearFormData = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      latitude: '',
      longitude: ''
    });
  };

  // ✅ Get location (with user permission)
  const getLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject("Geolocation is not supported by your browser.");
      } else {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
          },
          (error) => {
            reject("Location permission denied or unavailable.");
          }
        );
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.confirmPassword !== formData.password) {
      alert("Passwords do not match");
      return;
    }
    

    if (
      formData.name === '' ||
      formData.email === '' ||
      formData.password === '' ||
      formData.phone === '' ||
      formData.confirmPassword === ''
    ) {
      alert("Please Enter All required fields");
      return;
    }
    if(formData.password.length<4)
    {
      alert("Password must be greater than or equals to four character");
      return;
    }
    if(formData.phone.length<10 )
    {
      alert("Phone No must be greater than 9 digit");
      return;
    }
     if(formData.phone.length>10 )
    {
      alert("Phone no should be 10 digit");
      return;
    }

    try {
      // ✅ Step 1: Fetch user location before calling API
      const location = await getLocation().catch((err) => {
        console.warn(err);
        return { latitude: null, longitude: null };
      });

      // ✅ Step 2: Add location to payload
      const payload = {
        name: formData.name,
        email: formData.email.toLocaleLowerCase(),
        phone: formData.phone,
        password: formData.password,
        latitude: location.latitude,
        longitude: location.longitude,
      };

      console.log(location.latitude)
      console.log(location.longitude)

      // ✅ Step 3: Send to backend
      const response = await axios.post(baseUrl + 'register_new_user', payload, {
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.data.Status) {
        setOtpForm(true);
        navigate("/otp_verify");
        alert("Otp send to your email");
       // ✅ Store JWT

        clearFormData();
          setIsRegister(true);
        localStorage.setItem("isRegister", isRegister);
        

      } else {
        alert(response.data.Message);
      }
    } catch (error) {
      console.error('Error:', error);
      alert("Something went wrong");
    }
  };

  const openLoginPage = () => {
    setIsLoginPageOpen(true);
    navigate("/");
  };

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      marginTop: "50px",
      fontFamily: "Arial, sans-serif"
    }}>
      {!otpForm && !isLoginPageOpen && (
        <h2 style={{ marginBottom: "20px", color: "#333" }}>Register</h2>
      )}

      {!otpForm && !isLoginPageOpen && (
        <div style={{
          width: "400px",
          padding: "20px",
          backgroundColor: "#f5f5f5",
          borderRadius: "12px",
          boxShadow: "0 4px 8px rgba(0,0,0,0.2)"
        }}>
          <form onSubmit={handleSubmit} style={{ textAlign: "left" }}>
            <label style={{ fontWeight: "bold" }}>Name:</label><br />
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              style={{
                width: "100%",
                padding: "10px",
                marginTop: "5px",
                marginBottom: "15px",
                borderRadius: "8px",
                border: "1px solid #ccc"
              }}
            /><br />

            <label style={{ fontWeight: "bold" }}>Email:</label><br />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              style={{
                width: "100%",
                padding: "10px",
                marginTop: "5px",
                marginBottom: "15px",
                borderRadius: "8px",
                border: "1px solid #ccc"
              }}
            /><br />

            <label style={{ fontWeight: "bold" }}>Phone:</label><br />
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              style={{
                width: "100%",
                padding: "10px",
                marginTop: "5px",
                marginBottom: "15px",
                borderRadius: "8px",
                border: "1px solid #ccc"
              }}
            /><br />

            <label style={{ fontWeight: "bold" }}>Password:</label><br />
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              style={{
                width: "100%",
                padding: "10px",
                marginTop: "5px",
                marginBottom: "15px",
                borderRadius: "8px",
                border: "1px solid #ccc"
              }}
            /><br />

            <label style={{ fontWeight: "bold" }}>Confirm Password:</label><br />
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              style={{
                width: "100%",
                padding: "10px",
                marginTop: "5px",
                marginBottom: "20px",
                borderRadius: "8px",
                border: "1px solid #ccc"
              }}
            /><br />

            <div style={{ textAlign: "center" }}>
              <button
                type="submit"
                style={{
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  marginRight: '10px'
                }}
              >
                Register
              </button>

              <button
                type="button"
                onClick={openLoginPage}
                style={{
                  backgroundColor: '#2196F3',
                  color: 'white',
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                Login
              </button>
            </div>
          </form>
        </div>
      )}

      <div>
        {isLoginPageOpen && <LoginForm />}
        {otpForm && <OtpVerifyForRegistration />}
      </div>
    </div>
  );
};

export default RegisterNewUser;
