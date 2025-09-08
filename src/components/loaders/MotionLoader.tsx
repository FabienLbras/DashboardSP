import React from 'react'
import logo from "../../assets/logo2.png";

const MotionLoader = () => {
    return (
        <div className="h-screen flex items-center justify-center mb-8 animate-fade-in-up">
            <img 
              src={logo} 
              alt="Success Payment Logo" 
              className="max-w-full max-auto h-20 w-auto animate-pulse-glow"
              style={{marginTop: '-200px'}}
            />
        </div>
    )
}

export default MotionLoader;
