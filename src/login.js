import React, { useState } from 'react';
import axios from 'axios';
import RegisterNewUser from './register';
import HomePage from './homePage';
import ForgotPassword from './ForgotPassword';
import { useAppContext } from "./AppContext";
import { useNavigate } from 'react-router-dom';



const LoginForm = () => {
  const [formData, setFormData] = useState({
    userEmailId: '',
    password: ''
  });
    const navigate = useNavigate();

  const { baseUrl } = useAppContext();
  const [openHomePage, setOpenHomePage] = useState(false);
  const [openRegisterForm, setOpenRegisterform] = useState(false);
  const [forgotPasswordPage, setForgotPassword] = useState(false);
  const openRegisterPage = (e) => {
    setOpenRegisterform(true);
        navigate('/register');

  }
  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };








  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();


    if (formData.userEmailId === '' && formData.password === '') {
      alert("Please Enter email and password");
    }
    else if (formData.userEmailId === '') {
      alert("Please Enter a email");
    }
    else if (formData.password === '') {
      alert("Please Enter a password");
    }
    else {
      try {
        const response = await axios.post(baseUrl+'loginwithemail', {

          userEmailId: formData.userEmailId,
          password: formData.password


        }
        );



        if (response.data.Status) {
          setOpenHomePage(true);

          navigate("/home_page",{ state: { userEmailId:formData.userEmailId } });
              localStorage.setItem("token", response.data.token);
              
               // ✅ Store JWT

        }
        else {
          alert(response.data.Message);
        }

      } catch (error) {
        console.error('Login Failed:', error);

      }
    }
  };
  const openForgotPass = () => {
    setForgotPassword(true);
  }
  return (
    <div align="center">


      <div style={{ height: "130px", width: "400px",marginTop:'20px' ,backgroundColor: 'gray', borderRadius: '12px' }}>
        {!openRegisterForm && !openHomePage && <form onSubmit={handleSubmit} align="left">
          <label>Email:</label><br />
          <input
            type="email"
            name="userEmailId"
            value={formData.userEmailId}
            onChange={handleChange}
            required
          /><br />

          <label>Password:</label><br />
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
          <br /><br />

          <div align="center">
            <br />
            <button type="submit" style={{

              backgroundColor: 'skyblue',
              borderRadius: '10px'
            }}
            >Login</button> <button onClick={openRegisterPage}   >Register</button>
          </div>

        </form>}
        <div>

          {openRegisterForm && <RegisterNewUser />}
          
          {openHomePage && <HomePage />}

        </div>
      </div>
      <br /><br />
      <div>
      </div>
      {forgotPasswordPage && <ForgotPassword />}

    </div>
  );
};

export default LoginForm;
