import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import { NextRequest, NextResponse } from "next/server";
import multer from "multer";

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

export async function POST(req) {
  try {
    const { prompt } = req.body;
    const imageBuffer = req.file.buffer;

    if (!prompt) {
      return res.status(400).json({ error: "No prompt provided" });
    }

    const apiKey = process.env.GOOGLE_API_KEY || "your-google-api-key";
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const fileManager = new GoogleAIFileManager(apiKey);

    // Create a file-like object to upload
    const file = {
      buffer: imageBuffer,
      mimetype: req.file.mimetype,
      originalname: req.file.originalname,
    };

    // Upload the image
    const uploadResult = await fileManager.uploadFile(file.buffer, {
      mimeType: file.mimetype,
      displayName: file.originalname,
    });

    console.log(uploadResult);

    // Generate content using the uploaded file URI
    const result = await model.generateContent([
      prompt,
      {
        fileData: {
          fileUri: uploadResult.file.uri,
          mimeType: uploadResult.file.mimeType,
        },
      },
    ]);

    const response = await result.response.text();
    console.log(response);
    res.status(200).json({ text: response });
  } catch (error) {
    console.error("Error processing request:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
}

export const config = {
  api: {
    bodyParser: false, // Disable Next.js default body parsing
  },
};
