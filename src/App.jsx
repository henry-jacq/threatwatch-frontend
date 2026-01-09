import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import PcapConvert from "./pages/PcapConvert";
import PredictInference from "./pages/PredictInference";
import Evaluation from "./pages/Evaluation";
import About from "./pages/About";

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/pcap" element={<PcapConvert />} />
                <Route path="/inference" element={<PredictInference />} />
                <Route path="/evaluation" element={<Evaluation />} />
                <Route path="/about" element={<About />} />
            </Routes>
        </BrowserRouter>
    );
}
