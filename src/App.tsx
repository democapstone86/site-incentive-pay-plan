import { Routes, Route } from "react-router-dom";
import SippHomePage from "./pages/SippHomePage";
import IncentivePayPlans from "./pages/IncentivePayPlans";
import SippCalculator from "./pages/SippCalculator";

const App = () => {
  return (
    <Routes>
      {/* Home route */}
      <Route path="/" element={<SippHomePage />} />

      {/* Incentive Pay Plans */}
      <Route path="/incentive-pay-plans" element={<IncentivePayPlans />} />

      {/* Sipp Calculator */}
      <Route path="/practice-sipp-calculator" element={<SippCalculator />} />
    </Routes>
  );
};

export default App;
