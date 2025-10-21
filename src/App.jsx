import { BrowserRouter, Routes, Route, Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import './App.css'

import Student from "./pages/Student"
import Pipeline from "./pages/Pipeline"
import Monitoring from "./pages/Monitoring"
import Reflection from "./pages/Reflection"
import Instructor from "./pages/Instructor"

function App() {
  return (
    <BrowserRouter>
      {/* Navigation Bar */}
      <nav className="flex gap-4 p-4 border-b bg-slate-50 shadow-sm">
        <Link to="/" className="font-medium hover:text-blue-600">Student</Link>
        <Link to="/pipeline" className="font-medium hover:text-blue-600">Pipeline</Link>
        <Link to="/monitoring" className="font-medium hover:text-blue-600">Monitoring</Link>
        <Link to="/reflection"className="font-medium hover:text-blue-600">Reflection</Link>
        <Link to="/instructor" className="font-medium hover:text-blue-600">Instructor</Link>
      </nav>

      {/* Route Views */}
      <main className="p-6">
        <Routes>
          <Route path="/" element={<Student />} />
          <Route path="/pipeline" element={<Pipeline />} />
          <Route path="/monitoring" element={<Monitoring />} />
          <Route path="/reflection" element={<Reflection />} />
          <Route path="/instructor" element={<Instructor />} />
        </Routes>
      </main>
    </BrowserRouter>
  )
}


export default App
