import axios from "axios";
import { useState } from "react";
import { useAppContext } from "./AppContext";
import OtpVerifyPage from "./otpVerifyPage";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const { baseUrl } = useAppContext();
  const [pageOtp, setPageOtp] = useState(false);

  const sendOtp = async (e) => {
    e.preventDefault();
    try {
      const userEmail=email.toLowerCase();
      const response = await axios.post(baseUrl + "forgot_password", { userEmail });
      console.log(response);
      if (response.data === "OTP is send to your email") {
        alert("OTP is send to your email");
        setPageOtp(true);
      } else {
        alert("Account does not exit's")
        setPageOtp(false);
      }
    } catch (error) {

      console.error("Error sending OTP:", error);
    }
  };

  return (
    <div className="glass-container">
      {!pageOtp && (
        <div className="glass-card">
          <h2>Forgot Password</h2>
          <form onSubmit={sendOtp}>
            <div className="form-group">
              <input
                type="email"
                name="email"
                placeholder="Enter your Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="form-input"
              />
            </div>
            <button type="submit" className="btn btn-primary btn-block">
              Get OTP
            </button>
          </form>
        </div>
      )}
      {pageOtp && <OtpVerifyPage />}
    </div>
  );
};

export default ForgotPassword;
