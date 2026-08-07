import React, { useState } from 'react';
import axios from 'axios';
import { useAppContext } from "./AppContext";
import { useNavigate } from 'react-router-dom';
const AdminLoginForm = () => {
    const [formData, setFormData] = useState({
        userEmailId: '',
        password: ''
    });
    const navigate = useNavigate();

    const { baseUrl } = useAppContext();
    const [adminDashboards] = useState(false);


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
                const response = await axios.post(baseUrl + 'admin', {
                    userEmailId: formData.userEmailId,
                    password: formData.password
                });

                if (response.data.Status) {
                    localStorage.setItem("access_token", response.data.token);
                    const cleanedData = Object.fromEntries(
                        Object.entries(response.data).filter(([key]) => !isNaN(key))
                    );

navigate("/admin/dashboard", { state: { userdata: cleanedData } });

                }
                else {
                    alert(response.data.Message);
                }

            } catch (error) {
                alert("UserName or Password is wrong");

                console.error('Login Failed:', error);
            }
        }
    };



    return (
        <div className="glass-container">
            <div className="glass-card">
                {!adminDashboards && <h2>Admin Login</h2>}
                {!adminDashboards && (
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
                                placeholder="Admin Email"
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
                                placeholder="Admin Password"
                            />
                        </div>

                        <div className="btn-group">
                            <button type="submit" className="btn btn-primary btn-block">
                                Login
                            </button>
                        </div>
                    </form>
                )}

                <div>

                </div>
            </div>

            <br />

        </div>
    );
};

export default AdminLoginForm;
