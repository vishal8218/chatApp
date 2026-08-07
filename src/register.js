import axios from 'axios';
import React, { useEffect, useState } from 'react';
import OtpVerifyForRegistration from './otpNewUser';
import LoginForm from './login';
import { useAppContext } from "./AppContext";
import { useNavigate } from 'react-router-dom';
import { FaDownload } from 'react-icons/fa';

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
  const [isRegister, setIsRegister] = useState(false);

  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);

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
    if (formData.password.length < 4) {
      alert("Password must be greater than or equals to four character");
      return;
    }
    if (formData.phone.length < 10) {
      alert("Phone No must be greater than 9 digit");
      return;
    }
    if (formData.phone.length > 10) {
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
        email: formData.email.toLowerCase(),
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
        // localStorage.setItem("isRegister", isRegister);


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
    <div className="glass-container">
      {!otpForm && !isLoginPageOpen && (
        <div className="glass-card" style={{ position: "relative" }}>
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
          <h2>Register</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Name</label>
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="form-input"
                placeholder="Enter your name"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="form-input"
                placeholder="Enter your email"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                className="form-input"
                placeholder="Enter your phone"
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
                placeholder="Enter password"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="form-input"
                placeholder="Confirm password"
              />
            </div>

            <div className="btn-group">
              <button type="submit" className="btn btn-primary">
                Register
              </button>
              <button type="button" onClick={openLoginPage} className="btn btn-secondary">
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
