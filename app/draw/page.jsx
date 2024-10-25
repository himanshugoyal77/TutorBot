"use client";
import { useEffect } from "react";
import { Tldraw } from "tldraw";
import "tldraw/tldraw.css";

const DrawPage = () => {
  useEffect(() => {
    const getFromImage = async () => {
      try {
        const response = await fetch("/api/generateContent", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt: "Tell me about this image.",
            imagePath: "public/assets/ash.jpg",
          }),
        });

        if (!response.ok) {
          // Log the response status if it's not 200 OK
          console.error("Server error:", response.status, response.statusText);
          return;
        }

        // Parse response JSON
        const data = await response.json();
        console.log(data.text);
      } catch (error) {
        // Catch and log any errors in the fetch process
        console.error("Error fetching data:", error);
      }
    };

    getFromImage();
  }, []);

  return (
    <main>
      <div>
        <Tldraw inferDarkMode />
      </div>
    </main>
  );
};
export default DrawPage;
