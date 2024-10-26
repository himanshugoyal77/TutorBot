"use client";
import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import dynamic from 'next/dynamic';
import 'react-datepicker/dist/react-datepicker.css';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.entry';

// Dynamically import DatePicker to prevent SSR issues
const DatePicker = dynamic(() => import('react-datepicker'), { ssr: false });

// Set the worker source for pdf.js
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

// Function to extract text from PDF
const extractTextFromPDF = async (file) => {
  // Convert the file to an ArrayBuffer
  const fileBuffer = await file.arrayBuffer();

  // Load the PDF document
  const pdf = await pdfjsLib.getDocument(fileBuffer).promise;
  const textContent = [];

  // Loop through each page and extract text
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const pageText = await page.getTextContent();
    const pageTextStrings = pageText.items.map(item => item.str);
    textContent.push(pageTextStrings.join(' '));
  }

  // Return combined text from all pages
  return textContent.join('\n');
};

const StudyPlanForm = () => {
  // Initialize form state
  const { register, control, handleSubmit, watch, setValue } = useForm({
    defaultValues: {
      subjects: [{ subjectName: "", examDate: "", strength: "", chapters: "", difficulty: "", pdf: null }],
      startDate: null,
      endDate: null,
    },
  });

  // Use field array for dynamic subjects
  const { fields, append, remove } = useFieldArray({
    control,
    name: "subjects",
  });

  // Local state to hold extracted text
  const [extractedText, setExtractedText] = useState([]);

  const onSubmit = (data) => {
    console.log(data);
    console.log("All Extracted Text: ", extractedText); // Log the collected extracted text from PDFs
  };

  const handleFileChange = async (event, index) => {
    const file = event.target.files[0];
    if (file) {
      try {
        const text = await extractTextFromPDF(file);
        console.log("Extracted text:", text); // Log the extracted text
        setValue(`subjects.${index}.pdf`, text); // Store the extracted text in form state
        
        // Update the local state for extracted text
        setExtractedText(prev => {
          const newText = [...prev];
          newText[index] = text; // Store text per subject index
          return newText;
        });
      } catch (error) {
        console.error("Error extracting text from PDF:", error);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="px-40 py-4 space-y-4 bg-gray-900 text-gray-100 shadow-md">
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
        <div key={field.id} className="space-y-2 p-4 border rounded-lg bg-gray-800 border-gray-700 mx-44">
          <h3 className="font-bold text-lg">Subject {index + 1}</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label text-gray-300">Subject Name</label>
              <input
                type="text"
                className="input input-bordered w-full bg-gray-700 text-gray-100"
                {...register(`subjects.${index}.subjectName`, { required: true })}
              />
            </div>

            <div className="form-control">
              <label className="label text-gray-300">Exam Date</label>
              <DatePicker
                className="input input-bordered w-full bg-gray-700 text-gray-100"
                selected={watch(`subjects.${index}.examDate`)}
                onChange={(date) => setValue(`subjects.${index}.examDate`, date)}
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
                {...register(`subjects.${index}.difficulty`, { required: true })}
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
              />
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
          onClick={() => append({ subjectName: "", examDate: "", strength: "", chapters: "", difficulty: "", pdf: null })}
          className="btn btn-primary text-white px-8"
        >
          Add Another Subject
        </button>

        <button type="submit" className="btn btn-success text-white px-8">
          Submit
        </button>
      </div>
    </form>
  );
};

export default StudyPlanForm;
