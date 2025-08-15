import React, { useEffect, useState } from 'react';

const OtpTimer = () => {
  const [seconds, setSeconds] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => { 
    if (seconds > 0) {
      const timer = setInterval(() => {
        setSeconds((prev) => prev - 1);
      }, 1000);

      return () => clearInterval(timer); // Cleanup
    } else {
      setCanResend(true);
    }
  }, [seconds]);

  const resendOtp = () => {
    setSeconds(60);
    setCanResend(false);
    console.log('OTP resent');
  };

  return (
    <div style={{ textAlign: 'center' }}>
     
     
    
    </div>
  );
};

export default OtpTimer;
