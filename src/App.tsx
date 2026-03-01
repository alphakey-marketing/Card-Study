import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import CreateScreen from "./pages/Create";
import SwipeScreen from "./pages/Swipe";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/create" element={<CreateScreen />} />
        <Route path="/swipe/:id" element={<SwipeScreen />} />
      </Routes>
    </Router>
  );
}