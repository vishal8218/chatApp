import React, { useEffect, useState } from 'react';
import axios from 'axios';
import RegisterNewUser from './register';
import HomePage from './homePage';
import { useAppContext } from "./AppContext";
import { useNavigate } from 'react-router-dom';
import { FaDownload } from 'react-icons/fa';

const LoginForm = () => {
  const [formData, setFormData] = useState({
    userEmailId: '',
    password: ''
  });
  const navigate = useNavigate();

  const { baseUrl } = useAppContext();
  const [openHomePage, setOpenHomePage] = useState(false);
  const [openRegisterForm, setOpenRegisterform] = useState(false);

  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);

  // If user already has a token, skip login and go straight to home
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/home_page");
    }
  }, [navigate]);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const handleAppInstalled = () => {
      setShowInstallBtn(false);
      setDeferredPrompt(null);
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowInstallBtn(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to install prompt: ${outcome}`);
    setDeferredPrompt(null);
    setShowInstallBtn(false);
  };

  const openRegisterPage = () => {
    setOpenRegisterform(true);
    navigate('/register');
  };

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
    } else if (formData.userEmailId === '') {
      alert("Please Enter a email");
    } else if (formData.password === '') {
      alert("Please Enter a password");
    } else {
      try {
        const response = await axios.post(baseUrl + 'loginwithemail', {
          userEmailId: formData.userEmailId.toLowerCase(),
          password: formData.password
        });
        console.log(response)
        if (response.data.Status) {
          setOpenHomePage(true);
          navigate("/home_page", { state: { userEmailId: formData.userEmailId } });
          localStorage.setItem("token", response.data.token);
          localStorage.setItem("profileUrl", response.data.Profile_Url)
        } else if (!response.data.Status) {
          console.log(response)

          alert("Please Enter Correct Email & Password");
        }
      } catch (error) {

        alert("Please Enter Correct Email & Password");

        console.error('Login Failed:', error);
      }
    }
  };

  const openForgotPass = () => {
    navigate('/forgot_password');
  };

  return (
    <div className="glass-container">
      <div className="glass-card" style={{ position: "relative" }}>
        {!openRegisterForm && !openHomePage && (
          <>
            {showInstallBtn && (
              <button
                onClick={handleInstallClick}
                title="Download App"
                style={{
                  position: "absolute",
                  top: "20px",
                  right: "20px",
                  background: "rgba(0, 168, 132, 0.15)",
                  border: "1px solid var(--primary-color)",
                  color: "var(--primary-color)",
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 10,
                  transition: "all 0.2s ease",
                  outline: "none"
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = "var(--primary-color)";
                  e.currentTarget.style.color = "#ffffff";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = "rgba(0, 168, 132, 0.15)";
                  e.currentTarget.style.color = "var(--primary-color)";
                }}
              >
                <FaDownload size={16} />
              </button>
            )}
            <h2>Login</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  name="userEmailId"
                  value={formData.userEmailId}
                  onChange={handleChange}
                  required
                  className="form-input"
                  placeholder="Enter your email"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="form-input"
                  placeholder="Enter your password"
                />
              </div>

              <div className="btn-group">
                <button type="submit" className="btn btn-primary">
                  Login
                </button>
                <button type="button" onClick={openRegisterPage} className="btn btn-secondary">
                  Register
                </button>
              </div>
              <div className="mt-3 text-center">
                <button type="button" onClick={openForgotPass} className="btn-link">
                  Forgot Password?
                </button>
              </div>
            </form>
          </>
        )}

        <div>
          {openRegisterForm && <RegisterNewUser />}
          {openHomePage && <HomePage />}
        </div>
      </div>

    </div>
  );
};

export default LoginForm;
