import { Routes, Route } from "react-router-dom";
import SippHomePage from "./pages/SippHomePage";
import IncentivePayPlans from "./pages/IncentivePayPlans";
import SippCalculator from "./pages/SippCalculator";
import CreateIncentive from "./pages/CreateIncentive";

const App = () => {
  return (
    <Routes>
      {/* Home route */}
      <Route path="/" element={<SippHomePage />} />

      {/* Incentive Pay Plans */}
      <Route path="/incentive-pay-plans" element={<IncentivePayPlans />} />

      {/* Sipp Calculator */}
      <Route path="/practice-sipp-calculator" element={<SippCalculator />} />

      {/* Create Incentive */}
      <Route path="/createIncentive" element={<CreateIncentive />} />
    </Routes>
  );
};

export default App;
