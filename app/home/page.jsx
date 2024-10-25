"use client";

import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { ref, getDownloadURL, listAll } from "firebase/storage";
import Image from "next/image";
import { storage } from "../../util/firebase";
import Link from "next/link";
import Button from "../../components/ui/Button";
import { FilePlus, LogOut } from "lucide-react";
import textbooks from "../../common/textbook";
import './page.css'

const Home = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [files, setFiles] = useState(textbooks);

  // useEffect(() => {
  //   // load all the files from firebase storage
  //   const loadFiles = async () => {
  //     const _files = await listAll(ref(storage, "/"));
  //     _files.items.forEach(async (item) => {
  //       const url = await getDownloadURL(item);

  //       if (!files.find((file) => file.name === item.name)) {
  //         setFiles((prev) => [...prev, { url, name: item.name }]);
  //       }
  //     });
  //   };
  //   loadFiles();
  // }, []);
  const languages = [
    { text: 'Hello', lang: 'English' },
    { text: 'नमस्ते', lang: 'Hindi' },
    { text: 'હેલો', lang: 'Gujarati' },
  ];

  const [currentText, setCurrentText] = useState(languages[0].text);
  const [currentLang, setCurrentLang] = useState(languages[0].lang);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const nextIndex = (index + 1) % languages.length;
      setCurrentText(languages[nextIndex].text);
      setCurrentLang(languages[nextIndex].lang);
      setIndex(nextIndex);
    }, 1000); // Change text every 1 second

    return () => clearInterval(interval); // Clean up the interval on component unmount
  }, [index, languages]);
  

  return (
    <div className="w-full flex flex-col items-center bg-[#141414]  top-0">
      <div className="flex w-full flex-col items-center justify-center p-5">
      <div className="flex justify-center items-center h-[300px]">
      <div className="font-bold transition-opacity duration-500 ease-in-out gradient-text text text-9xl">
        {currentText} <span className="text-lg"></span>
      </div>
    </div>
        <h1 className="text-4xl leading-relaxed md:w-[60%] text-center font-semibold text-white bg-inherit mb-8">
          You have total {files.length} Subjects, Create your <br />
          <span className=" font-bold text-5xl gradient-text">
            {" "}
            Personalised{" "}
          </span>
          Study Plan
        </h1>

        <button
          text="Create Study Plan"
          className="h-24 px-8 rounded-md new_button"
          icon={<FilePlus className="icon" />}
          onClick={() => router.push("/study-plan")}
        >Create Study Plan</button>
      </div>

      <div className="h-4 my-12 flex w-[80%] justify-center items-center">
        <hr className="w-full opacity-50" />
        <h1 className="text-white bg-inherit mx-12">or</h1>
        <hr className="w-full opacity-50" />
      </div>

      <h1 className="text-4xl mt-8 leading-relaxed md:w-[60%] text-center font-semibold text-white bg-inherit">
        Start Learning with your favourite Subjects with<div className="gradient-text">LLMs in 10+ Regional Languages</div>
      </h1>

      {/* <div className="w-full h-min flex justify-center items-center mt-10">
        <div className="w-[80%] mb-8 pb-20 grid items-center grid-cols-3 md:grid-cols-3 gap-4 p-4 mt-10"> */}
          {/* show only unique files */}
          <div className="flex flex-wrap justify-center mt-8 gap-4"> {/* Added gap for spacing */}
      {files.map((file) => (
        <div
          key={file.name}
          className="w-[300px] h-min px-3 py-4 flex flex-col items-center rounded-md shadow-lg bg-gray-800 hover:bg-gray-700 transition-all duration-300" // Removed mx-4 to avoid excessive horizontal spacing
        >
          <Image
            className="w-[200px] h-[250px] cursor-pointer object-cover rounded-t-md"
            src={file.cover}
            alt={file.cover}
            width={200} // Set to match the displayed size
            height={250} // Set to match the displayed size
          />

          <Link
            className={`h-11 w-[200px] flex items-center justify-center gap-2
                border-none text-white font-light ease-in transition-all duration-300
                px-5 rounded-b-md text-lg text-center`} // Apply gradient text class
            href={{
              pathname: `/chapters`,
              query: {
                name: file.name,
              },
            }}
          >
            {file.name.toString().replace(".pdf", "")}
          </Link>
        </div>
      ))}
    </div>
        </div>
    //   </div>
    // </div>
  );
};

export default Home;
