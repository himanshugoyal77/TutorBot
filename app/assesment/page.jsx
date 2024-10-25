"use client";
import React, { useEffect, useState } from "react";
import { Ellipsis, School2Icon, SendHorizontalIcon } from "lucide-react";
import { Pinecone } from "@pinecone-database/pinecone";
import { PineconeStore } from "@langchain/pinecone";
import { formatDocumentsAsString } from "langchain/util/document";
import {
    RunnablePassthrough,
//   PromptTemplate,
  RunnableSequence,
} from "@langchain/core/runnables";
import { ChatPromptTemplate, PromptTemplate } from "@langchain/core/prompts";

import { BufferMemory, ChatMessageHistory } from "langchain/memory";

import { useSearchParams } from "next/navigation";
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import { CohereEmbeddings, ChatCohere } from "@langchain/cohere";
import { auth, firestore } from "../../util/firebase";
import { doc, getDoc } from "firebase/firestore";
import { StringOutputParser } from "@langchain/core/output_parsers";

// Get user data

export default function ChatComponent({ params}) {
    // const [user] = useAuthState(auth);
    const searchParams = useSearchParams();
    const bookName = searchParams.get("name");
    // const chapterName = searchParams.get("chapter");
  const user = auth.currentUser;
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState([]); // Store generated MCQs
  const pastMessages = []
  const [userAnswers, setUserAnswers] = useState({});
  const [score, setScore] = useState(null);

  const saveScore = async () => {
    console.log('This is user')
    console.log(user.uid)
    if (user && score !== null) {
        const userRef = doc(firestore, "users", user.uid);
        await setDoc(userRef, { PoemScore: score }, { merge: true });
    }
};



  const embeddings2 = new HuggingFaceInferenceEmbeddings({
    apiKey: "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", // In Node.js defaults to process.env.HUGGINGFACEHUB_API_KEY
    //  model: "FacebookAI/xlm-mlm-enro-1024",
    //model: "sentence-transformers/all-mpnet-base-v2",
    model: "all-miniLM-L6-v2",
  });

  const cohereEmbedding = new CohereEmbeddings({
    apiKey: "WKOB0yTzRQ4QofPRmzoZXVG6FoL09KG2GxZXNDJ2",
    batchSize: 48, // Default value if omitted is 48. Max value is 96
    model: "embed-english-v3.0",
    dimension: 768,
  });

  const pineconeClient = new Pinecone({
    apiKey: "1606193b-cdb4-4ed7-9462-2bf15c89d21e",
    //"f0574308-c64b-489b-bee3-79e29eb193b7",
  });
  const generateMCQs = async () => {
    console.log("clickeddddddd")
    try {
      setLoading(true);
      await pineconeClient.getConfig();
      const pineconeIndex = pineconeClient.index("project");
console.log(pineconeIndex)
      const vectorStore = await PineconeStore.fromExistingIndex(cohereEmbedding, {
        pineconeIndex,
        namespace: bookName.toString().includes("National_Science_Tectbook")
          ? "Science"
          : "deen101",
      });

      const retriever = vectorStore.asRetriever();
console.log(retriever)
      const questionPrompt = PromptTemplate.fromTemplate(`
        You are a helpful assistant that generates multiple-choice questions (MCQs).
        Do not write anything before or after the answer.
        Answer the following based on the following context:
        {context}
         Here is an example of how you should respond, you give me a json object with:
        
        {{
            [ 
                "question": <question>,
                "options": [
                    "A) <option A>",
                    "B) <option B>",
                    "C) <option C>",
                    "D) <option D>"
                ],
                "correctAnswer": <correct answer>
            ]
        }}
       Question : {question}

      Answer
        Answer:
        
        `);


      const llm = new ChatCohere({
        model: "command-r-plus",
        temperature: 0,
        maxRetries: 2,
        apiKey: "WKOB0yTzRQ4QofPRmzoZXVG6FoL09KG2GxZXNDJ2", 
      });

      console.log(llm)
    //   const questionInput = {
    //     ,
    //     chatHistory: "", // Provide any chat history if needed
    //     context: "", // Provide any additional context if needed
    //   };

    const memory = new BufferMemory({
        chatHistory: new ChatMessageHistory(pastMessages),
      });

    const chain = RunnableSequence.from([
        {
          context: retriever.pipe(formatDocumentsAsString),
          question : new RunnablePassthrough()
        },
        questionPrompt,
        llm,
        new StringOutputParser(),
      ]);

      var res = ""
      const temp = await vectorStore.similaritySearch(`generate 10 mcqs on the subject ${bookName}`, 24);
      console.log("results", temp);
      for( let i=0 ; i<temp.length;i++ ){
        res+=temp[i].pageContent
        // console.log("i",t)
      }

      const result = await chain.invoke( `generate 10 mcqs on the provided context ${res}`);
      console.log("This is result");
      console.log(result.trim().replaceAll("```", "").replace("json", ""))
    setQuestions(JSON.parse
        (result.trim().replaceAll("```", "").replace("json", ""))
    ); 
    setLoading(false)
    console.log('This is question')
    console.log(questions)
    questions.forEach((q)=>{

        console.log(q.options)
    })
     // setQuestions(result); // Assuming result is an array of question objects
    } catch (e) {
      console.error("Error generating MCQs:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateMCQs();
  }, []);
  const handleOptionSelect = (questionIndex, option) => {
    setUserAnswers((prev) => ({ ...prev, [questionIndex]: option }));
};

const handleSubmit = () => {
    const correctAnswers = questions.reduce((acc, question, index) => {
        if (userAnswers[index] === question.correctAnswer) {
            acc += 1;
        }
        return acc;
    }, 0);
    setScore(correctAnswers);
    saveScore(); // Save the score to Firebase
    alert(`Your score: ${score} out of ${questions.length}`);
};

  return (
    <div className="flex flex-col pl-40 pr-40 min-h-screen text-white">
        {loading ? (
            <div className="align-center">

            <Ellipsis className="animate-pulse" />
            </div>
        ) : (
            <div className="min-h-screen  text-white">
            {questions.map((q, index) => (
                <div key={index} className="card bg-gray-600 shadow-md p-4 mb-4 text-neutral-content h-min">
                    <h2 className="card-title h-min bg-gray-600 ">{index + 1}. {q.question}</h2>
                    <ul className="list-none space-y-2 mt-2 h-min bg-gray-600">
                        {q.options.map((option) => (
                            <li key={option} onClick={() => handleOptionSelect(index, option)} className="flex items-center space-x-2 bg-gray-600">
                                <input 
                                    type="radio" 
                                    name={`question-${index}`} 
                                    checked={userAnswers[index] === option} 
                                    onChange={() => handleOptionSelect(index, option)} 
                                    className="radio radio-primary bg-gray-600 "
                                />
                                <span className="text-lg bg-gray-600">{option}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
            <button onClick={handleSubmit} className="btn btn-primary w-full mt-4">Submit</button>
        
            {score !== null && (
    <p className="mt-4 text-white">Your score: {score} out of {questions.length}</p>
)}
        </div>
        
        )}
    </div>
);
}