"use client";

import React from "react";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "../../util/firebase";
import Button from "../ui/Button";
import { KeyRound } from "lucide-react";
import { useRouter } from "next/navigation";

const Login = () => {
  const router = useRouter();
  const signInWithGoogle = () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider);
  };

  return (
    <div className="h-full w-full flex justify-center items-center my-52 bg-[#141414]">
      <Button
        onClick={signInWithGoogle}
        text="Sign in with Google"
        icon={<KeyRound className="icon" />}
      ></Button>
    </div>
  );
};

export default Login;
