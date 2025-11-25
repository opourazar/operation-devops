import { BrowserRouter, Routes, Route, Link } from "react-router-dom"
import './App.css'
import { useState, useEffect } from "react";

import Student from "./pages/Student"
import ModuleWorkspace from "./pages/ModuleWorkspace"
import Reflection from "./pages/Reflection"
import Instructor from "./pages/Instructor"

function App() {
  const [reflectionCount, setReflectionCount] = useState(
    JSON.parse(localStorage.getItem("reflections") || "[]").length
  );

  useEffect(() => {
    const updateCount = () => {
      setReflectionCount(JSON.parse(localStorage.getItem("reflections") || "[]").length);
    };

    window.addEventListener("reflectionsUpdated", updateCount);
    return () => window.removeEventListener("reflectionsUpdated", updateCount);
  }, []);

  return (
    <BrowserRouter>
      {/* Navigation Bar */}
      <nav className="flex gap-4 p-4 border-b bg-slate-50 shadow-sm">
        <Link to="/" className="font-medium hover:text-blue-600">Student</Link>
        <Link to="/workspace" className="font-medium hover:text-blue-600">Workspace</Link>
        <Link to="/reflection"> 
          Reflection 
          <span className="ml-1 text-xs bg-slate-200 px-2 py-0.5 rounded-full">
            {reflectionCount}
          </span>
        </Link>
        <Link to="/instructor" className="font-medium hover:text-blue-600">Instructor</Link>
      </nav>

      {/* Route Views */}
      <main className="p-6">
        <Routes>
          <Route path="/" element={<Student />} />
          <Route path="/workspace" element={<ModuleWorkspace />} />
          <Route path="/reflection" element={<Reflection />} />
          <Route path="/instructor" element={<Instructor />} />
        </Routes>
      </main>
    </BrowserRouter>

  )
}


export default App
