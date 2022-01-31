import React, { useState } from "react";
import "./App.css";
import axios from "axios";
import Cookies from "js-cookie";

function App() {
  const [user, setUser] = useState({});
  const [err, setErr] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const refresh = (refreshToken) => {
    console.log("Refreshing token!");

    return new Promise((resolve, reject) => {
      axios
        .post("http://localhost:5000/refresh", { token: refreshToken })
        .then((data) => {
          if (data.data.success === false) {
            setErr("Login again");
            resolve(false);
          } else {
            const { accessToken } = data.data;
            Cookies.set("access", accessToken);
            resolve(accessToken);
          }
        });
    });
  };

  const requestLogin = async (accessToken, refreshToken) => {
    console.log(accessToken, refreshToken);
    return new Promise((resolve, reject) => {
      axios
        .post(
          "http://localhost:5000/protected",
          {},
          { headers: { authorization: `Bearer ${accessToken}` } }
        )
        .then(async (data) => {
          if (data.data.success === false) {
            if (data.data.message === "User not authenticated") {
              setErr("Login again");
              
            } else if (data.data.message === "Access token expired") {
              const accessToken = await refresh(refreshToken);
              return await requestLogin(accessToken, refreshToken);
            }

            resolve(false);
          } else {
            // protected route has been accessed, response can be used.
            setErr("Protected route accessed!");
            resolve(true);
          }
        });
    });
  };

  const handleChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
    console.log(user);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    axios.post("http://localhost:5000/login", { user }).then((data) => {
      const { accessToken, refreshToken } = data.data;
      setIsSubmitted(true);
      Cookies.set("access", accessToken);
      Cookies.set("refresh", refreshToken);
    });
  };

  const hasAccess = async (accessToken, refreshToken) => {
    if (!refreshToken) return null;

    if (accessToken === undefined) {
      // generate new accessToken
      accessToken = await refresh(refreshToken);
      return accessToken;
    }

    return accessToken;
  };

  const protect = async (e) => {
    let accessToken = Cookies.get("access");
    let refreshToken = Cookies.get("refresh");

    accessToken = await hasAccess(accessToken, refreshToken);

    if (!accessToken) {
   
    } else {
      await requestLogin(accessToken, refreshToken);
    }
  };

  const renderForm = (
    <div className="form">
      <form action="" onSubmit={handleSubmit} onChange={handleChange}>
        <div className="input-container">
          <label>Username </label>
          <input type="email" name="email" placeholder="Email address"  required />
         
        </div>
        <div className="input-container">
          <label>Password </label>
          <input type="password" name="password" placeholder="Password" required />
         
        </div>
        <div className="button-container">
          <input type="submit" />
        </div>
      </form>
    </div>
  );

  return (
    <div className="app">
      <div className="login-form">
        <div className="title">Sign In</div>
        {isSubmitted ? <div>User Succesfully logged in</div> : renderForm}
        {err}
        <div className="access_btn">
         <button onClick={protect} >Access Protected Content</button>
         </div>
      </div>
      
    </div>
  );
}

export default App;
