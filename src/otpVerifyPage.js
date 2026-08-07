import React, { useState } from "react";
import axios from "axios";
import { useAppContext } from "./AppContext";
import UpdatePassword from "./UpdatePassword";

const OtpVerifyPage = () => {
  const [otp, setOtp] = useState("");
  const { baseUrl } = useAppContext();
  const [pageUpdatePass, setPage] = useState(false);

  const otpVerify = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(baseUrl + "otp_verify", { otp });
      if (response.data === "OTP VERIFED SUCCESSFULLY !!!") {
        setPage(true);
      } else {
        alert("Otp expired or wrong otp");
      }
    } catch (error) {
      alert("Otp expired or wrong otp");
    }
  };

  return (
    <div className="glass-container">
      {!pageUpdatePass && (
        <div className="glass-card">
          <h3 className="text-center" style={{ marginBottom: "20px" }}>Enter OTP</h3>
          <form onSubmit={otpVerify}>
            <div className="form-group">
              <input
                type="text"
                name="otp"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={4}
                required
                className="form-input text-center"
                style={{ letterSpacing: "4px", fontSize: "1.2rem", textAlign: "center" }}
              />
            </div>
            <button type="submit" className="btn btn-primary btn-block">
              Verify OTP
            </button>
          </form>
        </div>
      )}

      {pageUpdatePass && <UpdatePassword />}
    </div>
  );
};

export default OtpVerifyPage;
