import { LogOut } from "lucide-react";
import React from "react";

const Button = ({ text, icon, onClick, className }) => {
  return (
    <button
      onClick={() => onClick()}
      className={`h-11 flex items-center gap-2 bg-[#6f42a9] hover:bg-[#8769af]
  border-none text-white font-light ease-in transition-all duration-300
  px-5 rounded-md text-lg text-center 
  ${className}
  `}
    >
      {icon} {text}
    </button>
  );
};

export default Button;
