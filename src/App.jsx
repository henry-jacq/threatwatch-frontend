import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import PcapConvert from "./pages/PcapConvert";
import InferencePlayground from "./pages/InferencePlayground"; 
import PredictUpload from "./pages/PredictUpload";
import Evaluation from "./pages/Evaluation";

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/pcap" element={<PcapConvert />} />
                <Route path="/inference" element={<PredictUpload />} />
                <Route path="/evaluation" element={<Evaluation />} />
            </Routes>
        </BrowserRouter>
    );
}
