"use client";

import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, firestore } from "../util/firebase";
import { useEffect, useState } from "react";
import Login from "../components/auth/Login";
import data from "../common/formData";
import Image from "next/image";
import toast, { Toaster } from "react-hot-toast";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { redirect } from "next/navigation";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [formCount, setFormCount] = useState(0);
  const [isNewUser, setIsNewUser] = useState(false);
  const [formData, setFormData] = useState({
    "Student's Name": "",
    "Student's Class": "",
    "Favourite Subjects": [],
    "Hide Words": "",
    Hobbies: [],
    "Cartoon Characters": [],
  });

  const checkIfNewUser = async (_user) => {
    const docRef = doc(firestore, "users", _user.uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      // navigate to home
      router.push("/home");
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        checkIfNewUser(user);
      } else {
        setUser(null);
      }
    });
  }, []);

  const saveToFirebase = async () => {
    // save the form data to firebasefirestore
    const db = firestore;
    const docRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      setFormData(data);
    } else {
      // if the user is not in the database, add the user to the database
      await setDoc(docRef, {
        formData,
      });
      localStorage.setItem("formData", JSON.stringify(formData));
      toast.success("Form submitted successfully");
      router.push("/home");
      setFormData({});
    }
  };

  return (
    <div className="w-full flex flex-col items-center p-4 gap-4">
      {user ? (
        <div className="w-full h-full flex flex-col gap-4">
          <div className="w-full h-min mt-12 flex flex-col gap-4 p-5 justify-center items-center">
            <h3 className="mt-5 text-2xl font-bold text-white h-min ">
              Please Verify Your Details
            </h3>

            <div className="w-full h-min flex flex-col gap-12 mt-14 justify-center items-center">
              {
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor={data[formCount].key}
                    className="text-white text-lg h-min"
                  >
                    {data[formCount].key}
                  </label>
                  {data[formCount].type === "text" ? (
                    <input
                      className="input border-2  outline-none border-[#6f42a9] w-full max-w-xs focus:outline-none focus:right-1  focus:ring-[#6f42a9] focus:border-[#6f42a9]"
                      type="text"
                      id={data[formCount].key}
                      value={formData[data[formCount].key]}
                      placeholder={data[formCount].options}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          [data[formCount].key]: e.target.value,
                        })
                      }
                      required={true}
                    />
                  ) : data[formCount].type === "select" ? (
                    <div className="grid grid-cols-3 gap-5 mt-4">
                      {data[formCount].options.map((option) => (
                        <label
                          key={option}
                          className="label text-white flex items-center gap-2 justify-start"
                        >
                          <input
                            type="checkbox"
                            className="checkbox text-white border-2 border-[#6f42a9]"
                            onChange={(e) => {
                              // check if the option is already in the array
                              if (
                                formData[data[formCount].key].includes(option)
                              ) {
                                setFormData((prev) => {
                                  const newData = { ...prev };
                                  newData[data[formCount].key] = newData[
                                    data[formCount].key
                                  ].filter((item) => item !== option);
                                  return newData;
                                });
                              } else {
                                setFormData((prev) => {
                                  const newData = { ...prev };
                                  newData[data[formCount].key] = [
                                    ...prev[data[formCount].key],
                                    e.target.value,
                                  ];
                                  return newData;
                                });
                              }
                            }}
                            value={option}
                          />
                          <span className="label-text text-white">
                            {option}
                          </span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-5 mt-4">
                      {data[formCount].options.map((option) => (
                        <label
                          key={option}
                          className="label flex items-center gap-2 justify-start"
                        >
                          <Image
                            className={`w-20 h-20 cursor-pointer rounded-full object-contain border-2 ${
                              formData[data[formCount].key]?.includes(option)
                                ? "border-[#6f42a9]"
                                : "border-blue-300"
                            }`}
                            src={option}
                            alt={option}
                            width={100}
                            height={100}
                            onClick={() => {
                              // check if the option is already in the array
                              if (
                                formData[data[formCount].key].includes(option)
                              ) {
                                setFormData((prev) => {
                                  const newData = { ...prev };
                                  newData[data[formCount].key] = newData[
                                    data[formCount].key
                                  ].filter((item) => item !== option);
                                });
                              } else {
                                setFormData((prev) => {
                                  const newData = { ...prev };
                                  newData[data[formCount].key] = [
                                    ...prev[data[formCount].key],
                                    option,
                                  ];
                                  return newData;
                                });
                              }
                            }}
                          />
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              }

              <div className="flex w-[50%] h-min justify-between">
                <button
                  className="w-[80px] text-white"
                  onClick={() => setFormCount(formCount - 1)}
                  disabled={formCount === 0}
                >
                  Previous
                </button>
                {formCount < data.length - 1 && (
                  <button
                    className="btn btn-primary w-[80px]"
                    onClick={() => {
                      if (formData[data[formCount].key] === "") {
                        toast.error("Please fill all the fields");
                      } else {
                        setFormCount(formCount + 1);
                      }
                    }}
                    disabled={formCount === data.length - 1}
                  >
                    Next
                  </button>
                )}
                {formCount === data.length - 1 && (
                  <button
                    onClick={saveToFirebase}
                    className="btn btn-primary w-[80px]"
                  >
                    Submit
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <Login />
      )}
    </div>
  );
}
