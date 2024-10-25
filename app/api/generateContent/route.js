import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req)  {
    if (req.method == 'POST') { // Check if the request method is POST
    const { prompt, imagePath } = await req.json();
    // const apiKey = process.env.API_KEY; // It's better to use environment variables for sensitive data
    const apiKey = "AIzaSyCuQyaZzhmgpn6raGXIyX3Jo0k2DYV0V0Q"
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const fileManager = new GoogleAIFileManager(apiKey);

    try {
      const uploadResult = await fileManager.uploadFile(imagePath, {
        mimeType: "image/jpeg",
        displayName: "Jetpack drawing",
      });

      const result = await model.generateContent([
        prompt,
        {
          fileData: {
            fileUri: uploadResult.file.uri,
            mimeType: uploadResult.file.mimeType,
          },
        },
      ]);

    return  NextResponse.json({ text: result.response.text() });
      //  res.status(200).json({ text: result.response.text() });
    } catch (error) {
      console.error("Error:", error); // Log the error for debugging
      return NextResponse.json("Error: No question in the request", {
        status: 400,
      });
    //  res.status(500).json({ error: error.message });
    }
  } else {
    res.setHeader('Allow', ['POST']); // Set allowed methods for CORS
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
