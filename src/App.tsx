import { Routes, Route } from "react-router-dom";
import SippHomePage from "./pages/SippHomePage";

const App = () => {
  return (
    <Routes>
      {/* Home route */}
      <Route path="/" element={<SippHomePage />} />
    </Routes>
  );
};

export default App;
