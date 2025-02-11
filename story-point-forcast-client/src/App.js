// App.js
import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import RouterComponent from "./dashboard/Router";

const App = () => {
  return (
    <Router>
      <RouterComponent />
    </Router>
  );
};

export default App;
