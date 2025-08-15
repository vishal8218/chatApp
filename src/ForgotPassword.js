import axios from "axios";
import { useState } from "react"
import { useAppContext } from "./AppContext";


const ForgotPassword=()=>{

    const [email,setEmail]=useState('vk368065@gmail.com');
      const { baseUrl } = useAppContext();
    
    const sendOtp= async(e)=>{
            e.preventDefault();

         const response=await axios.post(baseUrl+"forgot_password?email="+email);
         alert(response.data);
    }

    const handleChange=(e)=>{
            const { name, value } = e.target;
    setEmail(e.target.value);
    }
    return(
        
        <div align="center">
                  <br/><br/>

            <form onSubmit={sendOtp}>
                <input
            type="email"
            name="email"
            value={email}
            onChange={handleChange}
            required
          /><br />
                <button type="submit">Get Otp</button>

            </form>
        </div>
    )
}
export default ForgotPassword;