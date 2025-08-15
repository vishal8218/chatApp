import { useLocation } from 'react-router-dom';
import { FaUserCircle } from 'react-icons/fa';
import { useState } from 'react';
import SearchUser from './searchUser';
import { useNavigate } from 'react-router-dom';

const HomePage = () => {
  const location = useLocation();
  const email = location.state?.userEmailId;
  const [openUSP, setOpenUSP] = useState(false);
  const openUserSearchPage = () => {
    setOpenUSP(true);
  }
  const navigate = useNavigate();

  const logout = () => {
    localStorage.setItem("token", "");
    navigate("/", { replace: true }); 

  }

  return (
    <div className="container">
      <div className="row align-items-center">
        <div className="col"></div>

        <div className="col-auto">
          <button className="btn btn-primary" onClick={openUserSearchPage}>
            Add
          </button>
        </div>

        <div className="col-auto">
          <div style={{ fontSize: '3rem', color: '#555' }}>
            <FaUserCircle />
            <h6>{email}</h6>
          </div>
        </div>
        <button className='btn btn-danger' onClick={logout}>logout</button>

      </div>


      {openUSP && <SearchUser senderEmail={email} />}
    </div>



  );
};

export default HomePage;



