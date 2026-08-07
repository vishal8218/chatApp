import React, { useState } from "react";
import axios from "axios";
import { useAppContext } from "./AppContext";
import { useNavigate } from "react-router-dom";

const UpdatePassword = () => {
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const navigate = useNavigate();
  const { baseUrl } = useAppContext();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password === formData.confirmPassword) {
      try {
        await axios.patch(
          baseUrl + "password_update",
          { password: formData.password },
          { headers: { "Content-Type": "application/json" } }
        );
        alert("Password Updated Successfully !!!");
        navigate("/");
      } catch (err) {
        console.log(err);
        alert("Password not Updated");
      }
    } else {
      alert("Password not matched");
    }
  };

  return (
    <div className="glass-container">
      <div className="glass-card">
        <h3 className="text-center" style={{ marginBottom: "20px" }}>Update Password</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">New Password:</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Confirm Password:</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className="form-input"
            />
          </div>

          <button type="submit" className="btn btn-primary btn-block">
            Update Password
          </button>
        </form>
      </div>
    </div>
  );
};

export default UpdatePassword;
