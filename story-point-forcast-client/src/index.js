import React from "react"
import ReactDOM from "react-dom/client"
import 'bootstrap/dist/css/bootstrap.min.css';
import Login from "./Authentication/loginPage"
import "./styles.css"
import { BrowserRouter } from "react-router-dom"
import Signup from './Authentication/signupPage';

const root = ReactDOM.createRoot(document.getElementById("root"))
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)