import React, { useRef, useState } from "react";
import html2canvas from "html2canvas-pro";

const CanvasBoard = () => {
  const [screenshot, setScreenshot] = useState(null);
  const containerRef = useRef(null);

  const uploadImageAsBase64 = async (imageDataUrl) => {
    try {
      const fetchResponse = await fetch(imageDataUrl);
      const blob = await fetchResponse.blob();
      const promptText = "solve the given question";
      const formData = new FormData();
      formData.append("image", blob, "screenshot.jpg");
      formData.append("prompt", promptText);

      const response = await fetch("/api/generateContent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    }
  };

  // const uploadImageAsFormData = async (imageDataUrl) => {
  //   try {
  //     // Convert base64 to blob
  //     const base64Response = await fetch(imageDataUrl);
  //     const blob = await base64Response.blob();

  //     // Create FormData and append the blob
  //     const formData = new FormData();
  //     formData.append("image", blob, "screenshot.jpg");

  //     const response = await fetch("/api/generateContent", {
  //       method: "POST",
  //       body: formData,
  //     });

  //     if (!response.ok) {
  //       throw new Error(`HTTP error! status: ${response.status}`);
  //     }

  //     const result = await response.json();
  //     return result;
  //   } catch (error) {
  //     console.error("Error uploading image:", error);
  //     throw error;
  //   }
  // };

  const takeScreenshot = async () => {
    try {
      if (!containerRef.current) {
        console.error("Container reference not found");
        return;
      }

      const canvas = await html2canvas(containerRef.current, {
        useCORS: true,
        allowTaint: true,
        logging: true,
        imageTimeout: 0,
        onclone: (clonedDoc) => {
          // Ensure images in cloned document are loaded
          const img = clonedDoc.querySelector("img");
          if (img) {
            img.crossOrigin = "anonymous";
          }
        },
      });

      const dataUrl = canvas.toDataURL("image/jpeg", 1.0);
      console.log(dataUrl);
      setScreenshot(dataUrl);
      await uploadImageAsBase64(dataUrl);
    } catch (error) {
      console.error("Screenshot failed:", error);
    }
  };

  const downloadScreenshot = (dataUrl) => {
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `screenshot-${new Date().getTime()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4">
      <div className="mb-4">
        <button
          onClick={takeScreenshot}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Take Screenshot
        </button>
      </div>

      <div
        ref={containerRef}
        id="photo"
        className="border rounded overflow-hidden h-full w-full"
      >
        <img
          className="w-full h-full object-contain"
          src="http://127.0.0.1:5000/video?type=blank"
          crossOrigin="anonymous"
          alt="webcam"
        />
      </div>
    </div>
  );
};

export default CanvasBoard;
