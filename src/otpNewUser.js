import React, { useState } from 'react';
import axios from 'axios'
import OtpTimer from './resendOtp';
import { useAppContext } from "./AppContext";
import { useNavigate } from 'react-router-dom';


const OtpVerifyForRegistration = () => {
  const [otp, setOtp] = useState();
  const { baseUrl } = useAppContext();
  const navigate = useNavigate();

  const otpVerify = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(baseUrl + 'verifyotp?otp=' + otp);


      alert(response.data);
      navigate("/login");

    } catch (error) {
      console.error('Error:', error);
      alert("Otp expired or wrong otp");
    }
  }

  return (
    <div align="center"  >
      <h3>Enter Otp</h3>
      <form onSubmit={otpVerify}>
        <input name="otp" value={otp} onChange={(e) => setOtp(e.target.value)} style={{ maxwidth: '200px', margin: 'auto', backgroundColor: 'gray', borderRadius: '12px' }} maxLength={4}></input>
        <br />
        <br />
        <button type="submit" style={{

          backgroundColor: 'skyblue',
          borderRadius: '10px'
        }} >Send</button>
      </form>
      <OtpTimer />
    </div>
  )
}
export default OtpVerifyForRegistration;