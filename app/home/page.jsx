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

  return (
    <div className="h-full w-full flex flex-col items-center bg-[#141414]">
      <div className="flex h-screen w-full flex-col items-center justify-center py-8 my-12">
        <h1 className="text-4xl leading-relaxed md:w-[60%] text-center font-semibold text-white bg-inherit mb-8">
          You have total {files.length} Subjects, Create your <br />
          <span className="text-[#011BAA] font-bold text-5xl">
            {" "}
            Personalised{" "}
          </span>
          Study Plan
        </h1>

        <Button
          text="Create Study Plan"
          className="h-24 px-8 rounded-md"
          icon={<FilePlus className="icon" />}
          onClick={() => router.push("/study-plan")}
        />
      </div>

      <div className="h-4 my-12 flex w-[80%] justify-center items-center">
        <hr className="w-full opacity-50" />
        <h1 className="text-white bg-inherit mx-12">or</h1>
        <hr className="w-full opacity-50" />
      </div>

      <h1 className="text-4xl mt-8 leading-relaxed md:w-[60%] text-center font-semibold text-white bg-inherit">
        Start Learning with your favourite Subjects
      </h1>

      <div className="w-full h-min flex justify-center items-center mt-10">
        <div className="w-[80%] mb-8 pb-20 grid items-center grid-cols-3 md:grid-cols-3 gap-4 p-4 mt-10">
          {/* show only unique files */}
          {files.map((file) => (
            <div
              key={file.name}
              className="w-[300px] px-3 h-min py-4 flex flex-col items-center gap-3 mx-4 rounded-md"
            >
              <Image
                className="w-[200px] h-[250px] cursor-pointer object-cover rounded-md"
                src={file.cover}
                alt={file.cover}
                width={100}
                height={100}
              />

              <Link
                className={`h-11 w-[200px] flex items-center justify-center gap-2
                    border-none text-white font-light ease-in transition-all duration-300
                    px-5 rounded-md text-lg text-center
                    
                    `}
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
    </div>
  );
};

export default Home;
