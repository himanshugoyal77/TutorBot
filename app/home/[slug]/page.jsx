"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import preferanceData from "../../../common/preferanceData";
import toast from "react-hot-toast";
import ChatComponent from "../../../components/Chatbot";
import textbooks from "../../../common/textbook";

const PreferancesPage = ({ params }) => {
  const searchParams = useSearchParams();
  const name = searchParams.get("name");
  const chapterName = searchParams.get("chapter");

  const url = textbooks
    .find((file) => file.name === name)
    .chapters.find((chapter) => chapter.name === chapterName)?.path;

  const [preferance, setPreferance] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState(0);

  const handleOptionClick = (option) => {
    setPreferance({
      ...preferance,
      [preferanceData[currentQuestion].label]: option,
    });
    if (currentQuestion === preferanceData.length - 1) {
      const formData = JSON.parse(localStorage.getItem("formData"));
      localStorage.setItem(
        "formData",
        JSON.stringify({ ...formData, ...preferance, url: url })
      );
      toast.success("Preferences saved successfully");
    }
    setCurrentQuestion(currentQuestion + 1);
  };

  console.log(name);

  return (
    <div className="w-full h-[87%] flex flex-col items-center justify-start bg-[#141414]">
      {currentQuestion < preferanceData.length ? (
        <div className="w-full h-[80%] flex flex-col items-center justify-center gap-4">
          <h1 className="text-4xl h-8  md:w-[60%] text-center font-semibold text-white bg-inherit mb-8">
            What are your learning preferences?
          </h1>
          <div className="w-1/3 h-min text-white flex flex-col items-center justify-center gap-4 rounded-md p-4">
            <h1 className="text-2xl h-4 font-light">
              {preferanceData[currentQuestion].question}
            </h1>
            <div className="h-[200px] mt-12 w-2/3 flex flex-col gap-3 items-center justify-center">
              {preferanceData[currentQuestion].options.map((option) => (
                <button
                  key={option}
                  onClick={() => handleOptionClick(option)}
                  className="w-full text-wrap h-12 border-2 rounded-md hover:bg-[#6f42a9] hover:text-white transition-all duration-300"
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full flex flex-col items-center justify-center gap-4 px-8">
          <div className="w-full h-full chat flex items-center justify-between">
            <div className="w-1/2 h-full">
              <MemoizedIframe url={url} />
            </div>
            <div className="w-1/2 h-full">
              <ChatComponent
                bookName={
                  url.split("/")[url.split("/").length - 1].split(".")[0]
                }
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Iframe = ({ url }) => {
  return (
    <iframe src={url} width={"100%"} height={"100%"} frameborder="0"></iframe>
  );
};

const MemoizedIframe = React.memo(Iframe);

export default PreferancesPage;
