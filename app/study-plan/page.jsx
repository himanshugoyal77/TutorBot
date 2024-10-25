"use client";

import React, { useEffect } from "react";
import { useState } from "react";
import textbooks from "../../common/textbook";
import { CohereClientV2 } from "cohere-ai";

const cohere = new CohereClientV2({
  token: "WKOB0yTzRQ4QofPRmzoZXVG6FoL09KG2GxZXNDJ2",
});

const StudyPlan = () => {
  const [loading, setLoading] = useState(false);
  const [studyPlan, setStudyPlan] = useState([]);

  // const llm = new ChatCohere({
  //   model: "command-r-plus",
  //   temperature: 0,
  //   maxRetries: 2,
  //   apiKey: "WKOB0yTzRQ4QofPRmzoZXVG6FoL09KG2GxZXNDJ2", // Set your API key here
  // });

  const generateStudyPlan = async () => {
    setLoading(true);

    const response = await cohere.chat({
      model: "command-r-plus-08-2024",
      messages: [
        {
          role: "user",
          content: `you are given a list of topics and their respective chapters, you need to generate a study plan for the topics based on the chapters provided.
          topics: ${textbooks.map((topic) => topic.name).join(", ")}
          chapters: ${textbooks
            .map((topic) =>
              topic.chapters.map((chapter) => chapter.name).join(", ")
            )
            .join(", ")}
            you give me a json object with the following fields:
           [ 
            topic: the topic you are studying
            chapters: the chapters you are studying
           ]
            `,
        },
      ],
      responseFormat: { type: "json_object" },
    });

    console.log(response.message.content[0].text);
    setStudyPlan(JSON.parse(response.message.content[0].text).study_plan);
    setLoading(false);
  };

  useEffect(() => {
    generateStudyPlan();
  }, []);

  console.log(typeof studyPlan);
  console.log(studyPlan.length);
  // studyPlan.

  return (
    <div className="text-white px-12 bg-[#121212] h-min">
      {loading ? (
        <h1>Loading...</h1>
      ) : (
        <div className="w-full h-min">
          {studyPlan.map((plan, index) => (
            <div
              key={index}
              className="w-full h-min flex items-center justify-around gap-14 space-y-8"
            >
              <h1 className="text-2xl font-bold text-center w-[30%]">
                {plan.topic}
              </h1>
              <ul className="steps steps-vertical w-[50%]">
                {plan.chapters.map((chapter, index) => (
                  <li key={index} className="step">
                    {chapter}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudyPlan;
