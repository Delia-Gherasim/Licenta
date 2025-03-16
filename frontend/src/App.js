import { useEffect } from "react";
import "./App.css";

function App() {
  useEffect(() => {
    fetch("http://127.0.0.1:8000/api")
      .then((response) => response.json())
      .then((data) => console.log(data));
  }, []);
  return <div className="App"></div>;
}

export default App;
