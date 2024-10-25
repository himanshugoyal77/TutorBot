import React from "react";

import { Ellipsis, School2Icon, SendHorizontalIcon } from "lucide-react";
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

export default function ChatComponent({ bookName }) {
  console.log("bookName", bookName);
  const user = auth.currentUser;
  const [inputText, setInputText] = useState("");
  const [error, setError] = useState("");
  const [loadingIndex, setLoadingIndex] = useState(null); // Track which response is loading
  const [pastMessages, setPastMessages] = useState([]);
  const [loading, setLoading] = useState(false);

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

      const vectorStore = await PineconeStore.fromExistingIndex(cohereEmbedding, {
        pineconeIndex,
        namespace: bookName.toString().includes("National_Science_Tectbook")
          ? "Science"
          : bookName,
      });

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

      setChatState((prev) => {
        const updatedChat = [...prev.chat];
        updatedChat[updatedChat.length - 1].response = resultOne;
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

  return (
    <div className="flex h-full flex-col rounded-l-2xl p-4 w-full px-8">
      <div
        id="chat-section"
        className="no-scrollbar h-full flex-grow overflow-y-auto rounded-xl py-4 transition-all duration-300 ease-in-out"
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
                <div className="mt-2  flex justify-start">
                  <div className="relative h-min max-w-xs rounded-lg bg-gray-100 p-3 tgray-900 shadow-md">
                    {chatState.status === "loading" &&
                    loadingIndex === index ? (
                      <div className="flex items-center text-black bg-inherit">
                        <Ellipsis className="icon animate-pulse" />
                      </div>
                    ) : (
                      message.response
                    )}
                  </div>
                </div>
              </div>
            ))}
            {error && <p style={{ color: "red" }}>{error}</p>}
          </div>
        )}
      </div>

      <div className="mt-4 h-min flex w-full flex-wrap items-center space-x-2 rounded-full border border-gray-300 p-2 shadow-md">
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
      </div>
    </div>
  );
}
