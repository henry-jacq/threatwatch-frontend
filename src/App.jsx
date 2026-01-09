import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import PcapConvert from "./pages/PcapConvert";
import PredictInference from "./pages/PredictInference";
import Evaluation from "./pages/Evaluation";

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/pcap" element={<PcapConvert />} />
                <Route path="/inference" element={<PredictInference />} />
                <Route path="/evaluation" element={<Evaluation />} />
            </Routes>
        </BrowserRouter>
    );
}
