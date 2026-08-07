import React, { useState } from "react";
import axios from "axios";
import { useAppContext } from "./AppContext";
import { useNavigate } from "react-router-dom";

const OtpVerifyForRegistration = () => {
  const [otp, setOtp] = useState("");
  const { baseUrl } = useAppContext();
  const navigate = useNavigate();

  const otpVerify = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(baseUrl + "verifyotp?otp=" + otp);
      alert(response.data);
      navigate("/");
    } catch (error) {
      alert("OTP expired or wrong OTP");
    }
  };

  return (
    <div className="glass-container">
      <div className="glass-card">
        <h2>Enter OTP</h2>

        <form onSubmit={otpVerify}>
          <div className="form-group">
            <input
              name="otp"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              maxLength={4}
              placeholder="Enter 4-digit OTP"
              className="form-input text-center"
              style={{ letterSpacing: "5px", fontSize: "1.2rem", textAlign: "center" }}
            />
          </div>

          <button type="submit" className="btn btn-primary btn-block">
            Verify
          </button>
        </form>
      </div>
    </div>
  );
};

export default OtpVerifyForRegistration;
