

"use client";
import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import dynamic from "next/dynamic";
import "react-datepicker/dist/react-datepicker.css";
import { serverTimestamp } from "firebase/firestore";
const { GoogleGenerativeAI } = require("@google/generative-ai");
import Markdown from 'react-markdown';

import { CohereClientV2 } from "cohere-ai";

const cohere = new CohereClientV2({
  token: "WKOB0yTzRQ4QofPRmzoZXVG6FoL09KG2GxZXNDJ2",
});



// Dynamically import DatePicker to prevent SSR issues
const DatePicker = dynamic(() => import("react-datepicker"), { ssr: false });

const StudyPlanForm = () => {

  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [haveresponse, setHaveresponse] = useState(false);
  const { register, control, handleSubmit, watch, setValue } = useForm({
    defaultValues: {
      subjects: [
        {
          subjectName: "",
          examDate: "",
          strength: "",
          chapters: "",
          difficulty: "",
          pdf: null,
        },
      ],
      startDate: null,
      endDate: null,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "subjects",
  });

  const [extractedText, setExtractedText] = useState([]);
  const [file, setFile] = useState(null);
  const [content, setContent] = useState("");

  // Handles file change and uploads the PDF for extraction
  const handleFileChange = (event, index) => {
    const selectedFile = event.target.files[0];
    setFile(selectedFile);
  };

  const handleUpload = async (index) => {
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://127.0.0.1:5000/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        setContent(data.content);
        const updatedExtractedText = [...extractedText];
        updatedExtractedText[index] = data.content;
        setExtractedText(updatedExtractedText); // Save extracted text for each subject
      } else {
        console.error(data.error);
      }
    } catch (error) {
      console.error("Error uploading file:", error);
    }
    finally{
      setLoading(false);
          }
  };

  const onSubmit = async (data) => {
    setLoading(true);
    console.log("helloooooooooo this is submit fun");
    console.log(data);
    const preparedSubjects = data.subjects.map((subject, index) => ({
      ...subject,
      extractedText: extractedText[index] || "No PDF content",
    }));

    const requestData = {
      startDate: data.startDate,
      endDate: data.endDate,
      subjects: preparedSubjects,
    };
    console.log(requestData);

    try {
      // Initialize GoogleGenerativeAI with your API key
      // const genAI = new GoogleGenerativeAI("AIzaSyBhzvUT9-kz3ZEVVddxaF-DRW3mheu1VoI"); // Replace with your actual API key
      // const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      // // Create the prompt based on the requestData
      // const prompt = `Create an efficient day-wise, subject-wise, and topic-wise study plan for the following data: what is squareroot of 4`;

      // // Generate content based on the prompt
      // const result = await model.generateContent(prompt);

      // // Log the generated response text
      // console.log("Generated Content: ", result.response.text());

      const result = await fetch("/api/generateContent", {
        method: "POST", // Specify the method
        headers: {
          "Content-Type": "application/json", // Set the content type to JSON
        },
        body: JSON.stringify({
          prompt: `Create an efficient day-wise, subject-wise, and topic-wise study plan for the following data : ${JSON.stringify(requestData)}`, // Send the prompt in the request body
        }),
      });
      // const response = await cohere.chat({
      //   model: "command-r-plus-08-2024",
      //   messages: [
      //     {
      //       role: "user",
      //       content: `You are a helpfull assestant for creating students study plan using the following context of a textbook: ${extractedText.join(", ")}}
      //         you use textbook data to generate a day-wise, subject-wise, and topic-wise study plan.
      //         The textbook content is maths content.

      //         you give me a json object with the following fields:
      //         [
      //           {
      //             day: "",
      //             subject: [{
      //               topic: [""],
      //               time: "",
      //               tips: ""
      //             }],
      //           }
      //         ]
      //       `,
      //     },
      //   ],
      //   responseFormat: { type: "json_object" },
      // });

      // console.log(response)

      // console.log("this is result :",result);

      // Optionally, you can also send the data to your API if needed
      // Uncomment the following block if you want to send requestData to your own API

      // const response = await fetch('https://your-api-endpoint.com/design-study-plan', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      // body: JSON.stringify({
      //   studyPlanRequest: requestData,
      //   message: 'Design an efficient day-wise, subject-wise, and topic-wise study plan for students.',
      // })

      if (result.ok) {
        const data = await result.json(); // Parse the JSON response
        setResponse(data.text);
        if(data.text){
          setHaveresponse(true);
        }
        
        console.log("Generated Content: ", data.text); // Access the text field from the response
      } else {
        console.error("API Error: ", result);
      }
    } catch (error) {
      console.error("Error generating content:", error);
    } finally{
      setLoading(false);
      console.log("Finished generating content")
    }
  };

  return (
    <>
    {haveresponse ? (
      <div className="mockup-browser bg-base-300 border m-10">
      <div className="mockup-browser-toolbar">
        <div className="input">https://yourplan.com</div>
      </div>
      <div className="bg-base-200 flex flex-col justify-center px-4 py-16">
      <Markdown>{response}</Markdown>
      </div>
    </div>
    
      
    ): (
      <>
        <form
      onSubmit={handleSubmit(onSubmit)}
      className="px-40 py-4 space-y-4 bg-gray-900 text-gray-100 shadow-md"
    >
      <div className="grid grid-cols-2 gap-4">
        <div className="form-control">
          <label className="label font-bold text-gray-300">Start Date</label>
          <DatePicker
            className="input input-bordered w-full bg-gray-800 text-gray-100"
            selected={watch("startDate")}
            onChange={(date) => setValue("startDate", date)}
            placeholderText="Start date"
          />
        </div>
        <div className="form-control">
          <label className="label font-bold text-gray-300">End Date</label>
          <DatePicker
            className="input input-bordered w-full bg-gray-800 text-gray-100"
            selected={watch("endDate")}
            onChange={(date) => setValue("endDate", date)}
            placeholderText="End date"
          />
        </div>
      </div>

      {fields.map((field, index) => (
        <div
          key={field.id}
          className="space-y-2 p-4 border rounded-lg bg-gray-800 border-gray-700 mx-44"
        >
          <h3 className="font-bold text-lg">Subject {index + 1}</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label text-gray-300">Subject Name</label>
              <input
                type="text"
                className="input input-bordered w-full bg-gray-700 text-gray-100"
                {...register(`subjects.${index}.subjectName`, {
                  required: true,
                })}
              />
            </div>

            <div className="form-control">
              <label className="label text-gray-300">Exam Date</label>
              <DatePicker
                className="input input-bordered w-full bg-gray-700 text-gray-100"
                selected={watch(`subjects.${index}.examDate`)}
                onChange={(date) =>
                  setValue(`subjects.${index}.examDate`, date)
                }
                placeholderText="Exam date"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label text-gray-300">Strength</label>
              <input
                type="text"
                className="input input-bordered w-full bg-gray-700 text-gray-100"
                {...register(`subjects.${index}.strength`, { required: true })}
              />
            </div>
            <div className="form-control">
              <label className="label text-gray-300">Difficulty Level</label>
              <select
                className="select select-bordered bg-gray-700 text-gray-100"
                {...register(`subjects.${index}.difficulty`, {
                  required: true,
                })}
              >
                <option value="">Select difficulty</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            <div className="form-control">
              <label className="label text-gray-300">Chapters</label>
              <input
                type="number"
                className="input input-bordered w-full bg-gray-700 text-gray-100"
                {...register(`subjects.${index}.chapters`, { required: true })}
              />
            </div>
            <div className="form-control">
              <label className="label text-gray-300">Upload PDF</label>
              <input
                type="file"
                onChange={(event) => handleFileChange(event, index)}
                className="file-input file-input-bordered bg-gray-700 text-gray-100"
                accept="application/pdf"
              />
              <button
                onClick={() => handleUpload(index)}
                type="button"
                className="btn btn-primary mt-2"
              >
                Upload
              </button>

              {loading && (
                <span className="loading loading-spinner loading-lg"></span>

              )}

              {/* {extractedText[index] && (
                <div>
                  <h3>Extracted Content:</h3>
                  <pre>{extractedText[index]}</pre>
                </div>
              )} */}
            </div>
          </div>

          <button
            type="button"
            onClick={() => remove(index)}
            className="btn btn-error text-white"
          >
            Remove Subject
          </button>
        </div>
      ))}

      <div className="flex justify-center space-x-4 mt-4">
        <button
          type="button"
          onClick={() =>
            append({
              subjectName: "",
              examDate: "",
              strength: "",
              chapters: "",
              difficulty: "",
              pdf: null,
            })
          }
          className="btn btn-primary text-white px-8"
        >
          Add Another Subject
        </button>

        <button type="submit" className="btn btn-success text-white px-8">
          Submit
        </button>
        
      </div>
    </form>
      </>
    )}
    
    </>
  );
};

export default StudyPlanForm;
