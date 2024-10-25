import React from "react";
import CanvasBoard from "./ui/CanvasBoard";
import {
  Ellipsis,
  School2Icon,
  SendHorizontalIcon,
  PencilRuler,
  Volume2,
  Brush,
  Hand,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Pinecone } from "@pinecone-database/pinecone";
import { PineconeStore } from "@langchain/pinecone";
import {
  RunnablePassthrough,
  RunnableSequence,
} from "@langchain/core/runnables";
import { createRetrievalChain } from "langchain/chains/retrieval";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { ChatPromptTemplate, PromptTemplate } from "@langchain/core/prompts";
import { formatDocumentsAsString } from "langchain/util/document";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { HuggingFaceInference } from "@langchain/community/llms/hf";
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import { ChatCohere, CohereEmbeddings } from "@langchain/cohere";
import { BufferMemory, ChatMessageHistory } from "langchain/memory";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { auth, firestore } from "../util/firebase";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import DrawBoard from "./DrawBoard";
import axios from "axios";

export default function ChatComponent({ bookName }) {
  console.log("bookName", bookName);
  const user = auth.currentUser;
  const [inputText, setInputText] = useState("");
  const [error, setError] = useState("");
  const [loadingIndex, setLoadingIndex] = useState(null); // Track which response is loading
  const [pastMessages, setPastMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [draw, setDraw] = useState(false);
  const [translation, setTranslation] = useState(false);

  const [languages] = useState([
    { code: "hi-IN", name: "Hindi" },
    { code: "bn-IN", name: "Bengali" },
    { code: "kn-IN", name: "Kannada" },
    { code: "ml-IN", name: "Malayalam" },
    { code: "mr-IN", name: "Marathi" },
    { code: "od-IN", name: "Odia" },
    { code: "pa-IN", name: "Punjabi" },
    { code: "ta-IN", name: "Tamil" },
    { code: "te-IN", name: "Telugu" },
    { code: "gu-IN", name: "Gujarati" },
  ]);
  const [selectedLanguage, setSelectedLanguage] = useState("en-IN");

  const [isDropdownOpen, setIsDropdownOpen] = useState(false); // State for dropdown visibility

  // Toggle dropdown visibility
  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);

  // Handle language selection
  const handleLanguageChange = (code) => {
    setSelectedLanguage(code);
    setIsDropdownOpen(false); // Close dropdown after selecting a language
    console.log(`Selected language: ${code}`);
  };
  const [drawWithBrush, setDrawWithBrush] = useState(false);

  useEffect(() => {
    // load from firebase firestore
    const loadMessages = async () => {
      const db = firestore;
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);
    };

    loadMessages();
  }, []);

  console.log(bookName.toString().includes("National_Science_Tectbook"));

  const embeddings2 = new HuggingFaceInferenceEmbeddings({
    apiKey: "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", // In Node.js defaults to process.env.HUGGINGFACEHUB_API_KEY
    //  model: "FacebookAI/xlm-mlm-enro-1024",
    //model: "sentence-transformers/all-mpnet-base-v2",
    //   model: "all-miniLM-L6-v2",
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

  const [questionsAsked, setQuestionsAsked] = useState(0);
  const [chatState, setChatState] = useState({
    chat: [
      {
        input: "",
        response: "Hi there! How can I help you today?",
      },
    ],
    status: "idle",
  });

  useEffect(() => {
    const element = document.getElementById("chat-section");
    element.scrollTo({ top: element.scrollHeight, behavior: "smooth" });
  }, [questionsAsked]);

  const handleSendMessage = async () => {
    if (inputText.trim()) {
      setChatState((prev) => ({
        chat: [...prev.chat, { input: inputText, response: "" }],
        status: "loading",
      }));

      // Send message to API
      await handleQuery(inputText);
      setLoadingIndex(chatState.chat.length + 1);
      setInputText("");
    }
  };

  const translateResponse = async (input) => {
    try {
      const response = await axios.post(
        "https://api.sarvam.ai/translate",
        {
          input: input, // Correctly set the input parameter
          source_language_code: "en-IN",
          target_language_code: selectedLanguage,
          speaker_gender: "Male",
          mode: "formal",
          model: "mayura:v1",
          enable_preprocessing: true,
        },
        {
          headers: {
            "api-subscription-key": "609361f5-3167-4583-bcc3-f2c0e4a6f7bd",
          },
        }
      );

      console.log("response", response.data); // Log the response data
      return response.data; // Return the actual data from the response
    } catch (error) {
      console.log("error", error);
      throw error; // Re-throw the error if needed
    }
  };

  const handleQuery = async (query) => {
    console.log("inputText", inputText);
    try {
      setLoading(true);
      await pineconeClient.getConfig();
      const pineconeIndex = pineconeClient.index("project");

      const memory = new BufferMemory({
        chatHistory: new ChatMessageHistory(pastMessages),
      });

      // Check if namespace exists
      const namespaces = await (
        await pineconeIndex.describeIndexStats()
      ).namespaces;

      const vectorStore = await PineconeStore.fromExistingIndex(
        cohereEmbedding,
        {
          pineconeIndex,
          namespace: bookName.toString().includes("National_Science_Tectbook")
            ? "Science"
            : bookName,
        }
      );

      const retriever = vectorStore.asRetriever();

      const formatChatHistory = (human, ai, previousChatHistory) => {
        const newInteraction = `Human: ${human}\nAI: ${ai}`;
        if (!previousChatHistory) {
          return newInteraction;
        }
        return `${previousChatHistory}\n\n${newInteraction}`;
      };

      const questionPrompt = PromptTemplate.fromTemplate(
        `You are an AI tutor helping students learn by guiding them to think critically rather than giving direct answers. 
        When a student asks a question or explains something, respond with a question or a hint to help them think about the problem differently. 
Use the Socratic method and only provide answers as a last resort. Always encourage the student to explore their reasoning.
        if question is related to math, you can give your own answer. else
        Use the following pieces of context to answer the question at the end.
        If you don't know the answer, just say you don't know. DO NOT try to make up an answer.
        If the question is not related to the context, politely respond that you are tuned to only answer questions that are related to the context.
    
Conversation so far:
    {chatHistory}

    {context}

    Question: {question}
    Helpful answer in markdown:`
      );

      const llm = new ChatCohere({
        model: "command-r-plus",
        temperature: 0,
        maxRetries: 2,
        apiKey: "WKOB0yTzRQ4QofPRmzoZXVG6FoL09KG2GxZXNDJ2", // Set your API key here
      });

      const chain = RunnableSequence.from([
        {
          question: (input) => input.question,
          chatHistory: async (input) => {
            const history = await memory.loadMemoryVariables({});
            console.log("history", history);
            return history.chatHistory || "";
          },
          context: async (input) => {
            const relevantDocs = await retriever.invoke(input.question);
            const serialized = formatDocumentsAsString(relevantDocs);
            console.log("serialized", serialized);
            return serialized;
          },
        },
        questionPrompt,
        llm,
        new StringOutputParser(),
      ]);

      const results = await vectorStore.similaritySearch(query, 4);
      console.log("results", results);
      if (results.length === 0) {
        return "No results found";
      }
      const resultOne = await chain.invoke({
        question: query,
      });
      console.log("resultOne", resultOne);

      await memory.saveContext(
        { input: query }, // User's input
        { output: resultOne } // AI's response
      );

      setPastMessages([
        ...pastMessages,
        new HumanMessage(query),
        new AIMessage(resultOne),
      ]);
      let translatedResult;
      if (selectedLanguage !== "en-IN") {
        const response = await translateResponse(resultOne);
        translatedResult = response.translated_text;
      } else {
        translatedResult = resultOne;
      }

      setChatState((prev) => {
        const updatedChat = [...prev.chat];
        updatedChat[updatedChat.length - 1].response = translatedResult;
        return { chat: updatedChat, status: "idle" };
      });

      setError("");
    } catch (e) {
      console.log(e);
      setChatState((prev) => {
        const updatedChat = [...prev.chat];
        updatedChat[updatedChat.length - 1].response =
          "Sorry, I'm having trouble with my connection. Please try again later.";
        return { chat: updatedChat, status: "idle" };
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDraw = () => {
    setDraw(!draw);
  };

  const url = "https://calc-fe.vercel.app";

  const [isOpen, setIsOpen] = useState(false); // State to track if the panel is open

  const togglePanel = () => {
    setIsOpen(!isOpen); // Toggle the open state
  };

  const textToSpeech = async (text) => {
    try {
      const response = await axios.post(
        "https://api.sarvam.ai/text-to-speech",
        {
          inputs: [text],
          target_language_code: selectedLanguage,
          speaker: "maitreyi",
          pitch: null,
          pace: null,
          loudness: null,
          speech_sample_rate: 8000,
          enable_preprocessing: true,
          model: "bulbul:v1",
        },
        {
          headers: {
            "api-subscription-key": "609361f5-3167-4583-bcc3-f2c0e4a6f7bd",
          },
        }
      );

      // Extract the base64 audio string from the array
      let base64Audio = response.data.audios[0];

      // Remove any potential data URL prefix
      if (base64Audio.startsWith("data:audio")) {
        base64Audio = base64Audio.split(",")[1];
      }

      const audioBlob = base64ToBlob(base64Audio, "audio/wav");
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.play();
    } catch (error) {
      console.error("Error playing audio:", error.message || error);
    }
  };

  // Helper function to convert base64 to Blob
  const base64ToBlob = (base64, mimeType) => {
    try {
      const byteCharacters = atob(base64);
      const byteArrays = [];

      for (let i = 0; i < byteCharacters.length; i += 512) {
        const slice = byteCharacters.slice(i, i + 512);
        const byteNumbers = new Array(slice.length);
        for (let j = 0; j < slice.length; j++) {
          byteNumbers[j] = slice.charCodeAt(j);
        }
        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
      }

      return new Blob(byteArrays, { type: mimeType });
    } catch (error) {
      console.error("Error converting base64 to Blob:", error.message || error);
      throw error;
    }
  };

  return (
    <div className="relative flex h-full flex-col rounded-l-2xl w-full">
      {draw && !drawWithBrush ? (
        // <DrawBoard />
        <MemoizedIframe url={url} />
      ) : draw && drawWithBrush ? (
        <CanvasBoard />
      ) : (
        <>
          <div className="relative flex h-full flex-col rounded-l-2xl w-full">
            <div
              className="h-min bg-slate-800 ml-auto rounded-t-2xl"
              style={{ position: "relative", display: "inline-block" }}
            >
              <button
                onClick={toggleDropdown}
                style={{
                  padding: "8px 12px",
                  backgroundColor: "#f1f1f1",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                {languages.find((lang) => lang.code === selectedLanguage)
                  ?.name || "Select Language"}
              </button>

              {isDropdownOpen && (
                <ul
                  style={{
                    position: "absolute",
                    top: "100%",
                    right: "0",
                    marginTop: "4px",
                    padding: "8px 0",
                    width: "200px",
                    backgroundColor: "#fff",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                    listStyle: "none",
                    zIndex: 10,
                  }}
                >
                  {languages.map((language) => (
                    <li key={language.code}>
                      <a
                        onClick={() => handleLanguageChange(language.code)}
                        style={{
                          display: "block",
                          padding: "8px 12px",
                          color: "#333",
                          cursor: "pointer",
                          textDecoration: "none",
                        }}
                        onMouseOver={(e) =>
                          (e.currentTarget.style.backgroundColor = "#f1f1f1")
                        }
                        onMouseOut={(e) =>
                          (e.currentTarget.style.backgroundColor = "#fff")
                        }
                      >
                        {language.name}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div
              id="chat-section"
              className="no-scrollbar h-full flex-grow overflow-y-auto rounded-xl py-4 transition-all duration-300 ease-in-out px-8 p-4"
            >
              {chatState.chat.length === 0 && chatState.status !== "loading" ? (
                <div className="flex h-min flex-col items-center justify-center rounded-xl bg-gray-200 tcenter shadow-md">
                  <School2Icon size={48} className="tgray-600" />
                  <h2 className="mt-4 h-2 tlg font-semibold tgray-700">
                    How can I assist you today?
                  </h2>
                </div>
              ) : (
                <div className="space-y-4">
                  {chatState.chat.map((message, index) => (
                    <div key={index} className="h-min">
                      {/* User Message */}
                      {message.input !== "" && (
                        <div className="flex justify-end">
                          <div className="max-w-xs h-min rounded-lg bg-[#6f42a9] p-3 text-white shadow-md">
                            {message.input}
                          </div>
                        </div>
                      )}
                      {/* Chatbot Response */}
                      <div className="mt-2 flex justify-start">
                        <div className="relative h-min max-w-xs rounded-lg bg-gray-100 p-3 tgray-900 shadow-md">
                          {chatState.status === "loading" &&
                          loadingIndex === index ? (
                            <div className="flex items-center text-black bg-inherit">
                              <Ellipsis className="icon animate-pulse" />
                            </div>
                          ) : (
                            message.response
                          )}
                          <button
                            onClick={() => textToSpeech(message.response)}
                          >
                            <Volume2 />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {error && <p style={{ color: "red" }}>{error}</p>}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Chat Input */}
      <div className=" mt-4 h-min flex w-full flex-wrap items-center space-x-2 rounded-full border border-gray-300 p-2 shadow-md">
        <button
          className="rounded-full bg-[#6f42a9] p-2 hover:bg-purple-600"
          onClick={handleDraw}
        >
          <PencilRuler className="icon bg-inherit text-white" />
        </button>

        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
          className="min-w-0 h-min border-none flex-1 rounded-full focus:outline-none focus:ring-0 bg-gray-100 px-4 py-2 tgray-900 placeholder-gray-500"
          placeholder="Type a message..."
        />
        <button
          onClick={handleSendMessage}
          className="rounded-full bg-[#6f42a9] p-2 hover:bg-purple-600"
        >
          <SendHorizontalIcon className="bg-inherit" color="white" size={20} />
        </button>

        {draw && (
          <div className="absolute left-0 bottom-20 p-2 rounded-md overflow-visible z-40 h-min w-min flex items-center justify-center gap-4 bg-inherit">
            <button
              className="rounded-full bg-[#6f42a9] p-2 hover:bg-purple-600"
              onClick={() => setDrawWithBrush(true)}
            >
              <Brush className="icon bg-inherit text-white" />
            </button>
            <button
              className="rounded-full bg-[#6f42a9] p-2 hover:bg-purple-600"
              onClick={() => setDrawWithBrush(false)}
            >
              <Hand className="icon bg-inherit text-white" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const Iframe = ({ url }) => {
  return (
    <iframe src={url} width={"100%"} height={"100%"} frameborder="0"></iframe>
  );
};

const MemoizedIframe = React.memo(Iframe);
