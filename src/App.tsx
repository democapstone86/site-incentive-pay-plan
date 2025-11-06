
import { Routes, Route } from "react-router-dom";
import SIPPHomePage from "./pages/SIPPHomePage";         
import ComingSoon from './pages/ComingSoon';
import SippCalculator from './pages/SippCalculator';
import IncentivePayPlans from './pages/IncentivePayPlans';
import Archived from './pages/Archived';

const App = () => {
  return (
    <Routes>
      {/* Home route */}
      <Route path="/" element={<SIPPHomePage />} />

       {/* Pages marked as Coming Soon */}
      
      <Route path="/incentive-pay-plans" element={<IncentivePayPlans />} />
      <Route path="/practice-sipp-calculator" element={<SippCalculator />} />
      <Route path='/archives'element={<Archived />} />
    </Routes>
  );
};

export default App;
