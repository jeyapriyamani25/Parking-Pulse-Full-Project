import { 
    BrowserRouter, 
    Route, 
    Routes,
    Navigate,
} from "react-router-dom"
import "./App.css"
import ParkingSlots from "./parking/parking_slots"
import Login from "./parking/login"
import Register from "./parking/register"
import OwnerRegister from "./parking/OwnerRegister"
import Booking from "./parking/Booking"
import OwnerDashboard from "./parking/OwnerDashboard"
import AdminDashboard from "./parking/AdminDashboard";
import MyBookings from "./parking/MyBookings";


function ProtectedRoute({ children }) {
  const isLoggedIn = sessionStorage.getItem("isLoggedIn");

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  return children;
}



function AdminRoute({ children }) {
  const isLoggedIn = sessionStorage.getItem("isLoggedIn");
  const isAdmin = sessionStorage.getItem("isAdmin") === "true";

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/parking_slots" replace />;
  }

  return children;
}

function OwnerRoute({ children }) {
  const isLoggedIn = sessionStorage.getItem("isLoggedIn");
  const isOwner = sessionStorage.getItem("isOwner") === "true";

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  if (!isOwner) {
    return <Navigate to="/parking_slots" replace />;
  }

  return children;
}


export default function App(){
    return(
        <BrowserRouter>
        <Routes>
            <Route path="/" element={<Login/>}/>
             <Route path="/login" element={<Login/>}/>
             <Route path="/register" element={<Register/>}/>
             <Route path="/owner-register" element={<OwnerRegister/>} />
             <Route path="/parking_slots" element={<ProtectedRoute><ParkingSlots/></ProtectedRoute>}/>
             <Route path="/booking" element={<Booking/>}/>
             <Route path="/owner-dashboard" element={<OwnerRoute><OwnerDashboard /></OwnerRoute>}/>
             <Route path="/admin-dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>}/>
             <Route path="/my-bookings" element={<ProtectedRoute><MyBookings /></ProtectedRoute>}/>
        </Routes>
        </BrowserRouter>
    )
}















// cake website

// import Header from "./Task 1 Webpage/header"
// import About from "./Task 1 Webpage/about"
// import Special from "./Task 1 Webpage/special"
// import Footer from "./Task 1 Webpage/footer"
// import Home from "./Task 1 Webpage/home"
// import Hooks from "./Task 1 Webpage/hooks"
// import { BrowserRouter, Routes, Route } from "react-router-dom"
// import State from "./Task 1 Webpage/State"

// export default function App(){
//     return(
//         <BrowserRouter>
//          <Header/>
//          <Routes>
//            <Route path="/" element={<Home/>}/>
//             <Route path="/about" element={<About/>}/>
//             <Route path="/menu" element={<Special/>}/>
//             <Route path="/contact" element={<Footer/>}/>
//             <Route path="/hooks" element={<Hooks/>}/>
//             <Route path="/use/State" element={<State/>}/>
        
//           </Routes>
//           </BrowserRouter>  
//           ) }










 // import { useState, useEffect } from "react";

// // // export default function App(){
// // //     const[student, setStudent]=useState([])
// //     useEffect(()=>{
// //         fetch("http://127.0.0.1:8000/student/?format=json")
// //         .then(response=>response.json())
// //         .then(data=>setStudent(data))
// //         .catch((error)=>{console.log("error")})
// //     },[])

// // return(
// //     <>
// //     <h1>Students data</h1>
// //     <h2>Name :{student.name}</h2>
// //     <h2>Course :{student.course}</h2>
// //     </>
// // )
// // }






// django + jwt
// App.jsx:

// import { BrowserRouter, Routes, Route } from "react-router-dom";

// import Login from "./jwt.+django/Login";
// import Register from "./jwt.+django/Register";
// import Dashboard from "./jwt.+django/Dashboard";


// function App() {

//     return (

//         <BrowserRouter>

//             <Routes>

//                 <Route
//                     path="/"
//                     element={<Login />}
//                 />

//                 <Route
//                     path="/login"
//                     element={<Login />}
//                 />

//                 <Route
//                     path="/register"
//                     element={<Register />}
//                 />

//                 <Route
//                     path="/dashboard"
//                     element={<Dashboard />}
//                 />

//             </Routes>

//         </BrowserRouter>

//     );
// }

// export default App;