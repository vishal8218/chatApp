import axios from "axios";
import { useState } from "react"
import { useAppContext } from "./AppContext";
import MessageSend from "./messageSend";
import ChatHistory from "./ChatHistory";

const SearchUser = ({ senderEmail }) => {
  const [formData, setFormData] = useState({
    friendEmail: '',
    email: ''
  });
  const [openchatPage, setOpenChat] = useState(false);
  const [openchathis,setOpenCH]=useState(false);
  const[reciverName,setReciverName]=useState();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };
  const [data, setData] = useState({});
  const [reciverid, setReciverId] = useState();
  const [senderid, setSenderId] = useState();
  const[id,setId]=useState();
  const token = localStorage.getItem("token"); // or wherever you store it

  const { baseUrl } = useAppContext();
  const[name,setName]=useState();


  const searchUser = async () => {
    try {
      const response = await axios.post(
        baseUrl + "add_friend",
        {
          friendEmail: formData.friendEmail,
          email: senderEmail,
        },
        {
          headers: {
            Authorization: token,
            "Content-Type": "application/json"
          }
        })
      alert(response.data.Message);
    }
    catch (error) {
      alert("User not exit's");

    }

    setFormData("");
  }
  const getFriends = async () => {
    const response = await axios.post(baseUrl + 'get_friends?userEmail=' + senderEmail,
      {}, // empty body
      {
        headers: {
          Authorization: token
        }
      }



    );


    setData(response.data);


  }
  const openchatpage = async (key,value) => {

    const response = await axios.post(baseUrl + "get_senderId"
      ,
      {
        email: senderEmail
      },
      {
        headers:
        {
          Authorization: token
        }
      }

    )
    setSenderId(response.data.UserId);
    setReciverId(key);
    setReciverName(value);
    if(openchatPage)
    {
     setOpenChat(false);
    }
    setOpenChat(true)


  }
  const openchathistory =(key,value)=>{
    setId(key);
    setName(value)
    if(openchathis)
    {
        setOpenCH(false);
    }
    else
    {
    setOpenCH(true);
    }
  }




  return (
    <div align="center">
      <div style={{ height: "100px", width: "250px", marginTop: '20px', backgroundColor: 'gray', borderRadius: '12px' }}>

        <label>Enter Email id</label><br />
        <input
          type="email"
          name="friendEmail"
          onChange={handleChange}
          required>

        </input>
        <br />
        <button className="btn btn-primary" onClick={searchUser}> Find</button>
        <button onClick={getFriends}>See List</button>

        {Object.keys(data).length > 0 && (
          <table border="1" cellPadding="8" style={{
            marginTop: "20px",
            borderCollapse: "collapse",
            backgroundColor: "black",
            color: "white",
            width: "130%"
          }}>
            <thead>
              <tr>
                <th style={{ border: "1px solid white" }}>Name</th>
                <th style={{ border: "1px solid white" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(data).map(([key, value]) => (
                <tr key={key}>
                  <td style={{ border: "1px solid white" }}>{typeof value === "object" ? JSON.stringify(value) : value}  </td>
                  <td style={{ border: "1px solid white", padding: "4px" }}>
                    <button className="btn btn-primary" onClick={() => openchatpage(key,value)}>chat</button>
                    <button className="btn btn-secondary" onClick={()=>openchathistory(key,value)} >Chat History</button>


                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {openchatPage && <MessageSend senderid={senderid} reciverid={reciverid} name={reciverName} />}
      {openchathis && <ChatHistory id={id} name={name} />}
    </div>
  )

}

export default SearchUser;