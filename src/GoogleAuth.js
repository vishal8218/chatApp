import React from "react";
import axios from "axios";
import { GoogleLogin } from "@react-oauth/google";
import { useAppContext } from "./AppContext";


const GoogleAuth = () => {

    const { baseUrl } = useAppContext();
  
  const handleSuccess = async (credentialResponse) => {
    try {

      // Google ID Token
      const googleToken = credentialResponse.credential;

      console.log("Google Token:", googleToken);

      // Send token to backend
      const response = await axios.post(
        baseUrl+"api/auth/google",
        {
          token: googleToken
        }
      );

      // Backend should return JWT + user data
      const { jwt, user } = response.data;

      // Save login session
      localStorage.setItem("token", jwt);
      localStorage.setItem("user", JSON.stringify(user));

      alert("Login Successful");

    } catch (error) {
      console.error("Google login failed:", error);
    }
  };

  const handleError = () => {
    console.log("Google Login Failed");
  };

  return (
    <div>
      <h3>Login with Google</h3>

      <GoogleLogin
        onSuccess={handleSuccess}
        onError={handleError}
        useOneTap
      />

    </div>
  );
};

export default GoogleAuth;