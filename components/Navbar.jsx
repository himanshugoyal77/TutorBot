"use client";

import Image from "next/image";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { auth } from "../util/firebase";
import { signOut } from "firebase/auth";
import { useEffect, useState } from "react";
import Button from "./ui/Button";
import { useRouter } from "next/navigation";

const Navbar = () => {
  const [user, setUser] = useState(null);
  const router = useRouter();

  const _user = auth.currentUser;
  useEffect(() => {
    setUser(_user);
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  return (
    <nav className="w-full h-20 flex justify-between items-center p-5 bg-[#141414]">
      <div className="flex items-center text-xl text-gray-200 gap-4">
        <Image
          src="/Logo.png"
          alt="logo"
          width={120}
          height={120}
          className="logo backdrop-invert-0"
        />
        <div className="flex items-center font-light gap-4 space-x-10">
          <div className="relative">
            <Link
              className="hover:scale-x-110
            transition-all duration-300 shadow-lg
            hover:after:content-[''] hover:after:absolute hover:after:w-full hover:after:h-0.5 hover:after:bg-[#fff] hover:after:bottom-0 hover:after:left-0
            "
              href="/home"
            >
              Home
            </Link>
          </div>
          <div className="relative">
            <Link
              className="hover:scale-x-110
            transition-all duration-300 shadow-lg
            hover:after:content-[''] hover:after:absolute hover:after:w-full hover:after:h-0.5 hover:after:bg-[#fff] hover:after:bottom-0 hover:  after:left-0
            "
              href="/modules"
            >
              Modules
            </Link>
          </div>
          <div className="relative">
            <Link
              className="hover:scale-x-110
            transition-all duration-300 shadow-lg
            hover:after:content-[''] hover:after:absolute hover:after:w-full hover:after:h-0.5 hover:after:bg-[#fff] hover:after:bottom-0 hover:after:left-0
            "
              href="/Revision"
            >
              Revision
            </Link>
          </div>
        </div>
      </div>

      {user && (
        <div className="flex items-center gap-4 space-x-5">
          <div className="avatar cursor-pointer">
            <div className="rounded-full h-10 w-10 ring">
              <Image
                src={user ? user?.photoURL : "/profile.webp"}
                alt="user-image"
                width={38}
                height={38}
              />
            </div>
          </div>
          <Button
            text="Log out"
            icon={<LogOut className="icon" />}
            onClick={handleLogout}
          />
        </div>
      )}
    </nav>
  );
};

export default Navbar;
