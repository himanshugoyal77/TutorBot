"use client";

import { useSearchParams } from "next/navigation";
import React, { useState } from "react";
import textbooks from "../../common/textbook";
import { BookOpen, CircleCheckBig, Clock } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const ChaptersPage = () => {
  const searchParams = useSearchParams();
  const name = searchParams.get("name");
  const [completed, setCompleted] = useState([]);

  const chapters = textbooks.find((book) => book.name === name).chapters;
  const cover = textbooks.find((book) => book.name === name).cover;

  return (
    <div className="w-full h-full  overflow-y-hidden bg-background pt-8">
      <div className="flex flex-col items-center h-min">
        <div className="w-[80%] flex items-center justify-start gap-4 space-x-4">
          <Image src={cover} alt="cover-page" width={230} height={230} />
          <div className="no_of_lessons w-full h-min flex flex-col items-start justify-center gap-2 space-x-2">
            <h1 className="text-4xl text-white mb-6">Subject: {name}</h1>

            <div className="flex items-center justify-start gap-2">
              <BookOpen className="w-6 h-6 text-[#6f42a9] mt-1" />
              <h1 className="text-xl font-light text-white">
                {chapters.length} Lessons
              </h1>

              <Clock className="w-6 h-6 text-[#6f42a9] mt-3" />
              <h1 className="text-xl font-light text-white">
                {chapters.length * 30 > 60
                  ? `${Math.floor((chapters.length * 30) / 60)} hours ${
                      (chapters.length * 30) % 60 == 0
                        ? ""
                        : `${(chapters.length * 30) % 60} minutes`
                    } `
                  : `${chapters.length * 30} minutes `}
                to complete
              </h1>
            </div>

            <div className="progress_bar w-[80%] my-8  flex flex-col items-start justify-end gap-4">
              <progress
                className="progress progress-accent h-4 text-[#6f42a9] rounded-full"
                value={(completed.length / chapters.length) * 100}
                max="100"
              ></progress>
              <h1 className="text-xl font-light text-white ml-auto">
                {completed.length} / {chapters.length} Lessons Completed
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full px-12 mt-20 pb-12">
        <div className="mt-12 w-[80%] h-min grid grid-cols-2 items-center justify-start gap-7 mx-auto">
          {chapters.map((chapter) => (
            <div className="w-[80%] cursor-pointer h-min bg-[#1e1e1e] rounded-md p-4 flex items-center justify-between">
              <h1 className="text-2xl font-semibold text-white bg-inherit flex items-center justify-start gap-4">
                <CircleCheckBig
                  onClick={() => {
                    setCompleted([...completed, name + chapter.name]);
                  }}
                  className={`w-5 h-5 cursor-pointer  ${
                    completed.includes(name + chapter.name)
                      ? "text-[#6f42a9]"
                      : ""
                  }`}
                />

                {chapter.name}
              </h1>
              <button className="bg-[#6f42a9] text-white px-4 py-2 rounded-md">
                <Link
                  href={{
                    pathname: `/home/${name}-${chapter.name}`,
                    query: {
                      name: name,
                      chapter: chapter.name,
                    },
                  }}
                  className="bg-inherit"
                >
                  Start Lesson
                </Link>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChaptersPage;
