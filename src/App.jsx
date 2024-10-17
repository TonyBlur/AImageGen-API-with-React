import React, { useState, useEffect, useCallback } from "react";
import "./App.css";
import { DisplayImages } from "./DisplayImages.jsx";
import ImageDownloader from "./ImagesDownload";
import { fetchImageModels, generateImage } from "./Api.js";

// Detect language for prompt translation
function isEnglish(text) {
  return /^[A-Za-z\s.,!?]*$/.test(text);
}

async function translate(translatingText) {
  const apiUrl = `${import.meta.env.VITE_OPEN_AI_BASE}/v1/chat/completions`;
  const openaiApiKey = import.meta.env.VITE_OPEN_AI_KEY;
  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        "model": "gpt-4o-mini",
        "messages": [
          {
          "role": "assistant",
          "content": translatingText,
          "name": "string"
          }
        ],
        "temperature": 0.5,
        "top_p": 1,
        "stream": "false",
        "max_tokens": 8000,
        "presence_penalty": 0,
        "frequency_penalty": 0,
        "logit_bias": {},
        "premium": "true"
      }),
    });
    const data = await response.json();
    let contentdata = data.choices[0].message.content;
    return contentdata;
  } catch (error) {
    console.log(error);
  }
}

function App() {
  const [requestErrorMessage, setRequestErrorMessage] = useState(null);
  const [requestError, setRequestError] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [placeholder, setPlaceholder] = useState("Generate: Bears with Paint Brushes the Starry Night, painted by Vincent Van Gogh...");
  const [quantity, setQuantity] = useState(5);
  const [model, setModel] = useState("sdxl");
  const [maxQuantity, setMaxQuantity] = useState(5);
  const [imageSize, setImageSize] = useState("1024x1024");
  const [buttonClicked, setButtonClicked] = useState(false);
  const [imageModels, setImageModels] = useState([]);

  useEffect(() => {
    const fetchModels = async () => {
      const imageModels = await fetchImageModels();
      if (imageModels.length <= 0) {
        console.error("No image models found.");
      } else {
        setImageModels(imageModels);
      }
    };

    fetchModels();
  }, []);

  const handleGenerateImage = useCallback(async () => {
    setRequestError(false);
    setImageSize(imageSize);
    setPlaceholder(`Generate: ${prompt}...`);
    setPrompt(prompt);
    setLoading(true);

    const response = await generateImage(model, prompt, quantity, imageSize);
    const data = await response.json();

    if (!response.ok) {
      setRequestError(true);
      setRequestErrorMessage(response.statusText);
    } else {
      const existingLinks = JSON.parse(localStorage.getItem("imageLinks")) || [];
      const newLinks = data.data.map((image) => image.url.split("?")[0]);
      const allLinks = [...newLinks, ...existingLinks];
      localStorage.setItem("imageLinks", JSON.stringify(allLinks));
    }

    setLoading(false);
  }, [model, prompt, quantity, imageSize]);

  useEffect(() => {
    if (buttonClicked) {
      // Call the handleGenerateImage function
      handleGenerateImage();
      // Reset buttonClicked state
      setButtonClicked(false);
    }
  }, [buttonClicked]);

  async function handleButtonClick() {
    // Get the input text
    const text = prompt;
      
    // Check if the text is English
    if (isEnglish(text)) {
      // If the text is English, call the generateImage function
      setButtonClicked(true);
    } else {
      try {
        const translatedText = await translate(`translate below text to English, and reply the translated text only: ${text}`);
        setPrompt(translatedText);
        // Set buttonClicked state to true
        setButtonClicked(true);
      } catch (error) {
        console.error('Error during translation:', error);
      }
    }
  }

  const handleModelSelect = (e) => {
    const selectedModelId = e.target.value;
    const selectedModel = imageModels.find((model) => model.id === selectedModelId);
    setModel(selectedModelId);

    if (selectedModel) {
      setMaxQuantity(selectedModel.max_images);
    }
    setQuantity(Math.min(quantity, maxQuantity));
  };

  return (
    <div className="app-main">
      {loading ? (
        <>
          <h2>Generating your unique images... Sit tight!</h2>
          <div className="lds-ripple">
            <div></div>
            <div></div>
          </div>
          <br />
          <DisplayImages />
        </>
      ) : (
        <>
          {requestError ? <div className="alert">{requestErrorMessage}</div> : null}

          <h2>AI Image Generator</h2>
          <div className="select-container">
            <select value={model} onChange={handleModelSelect}>
            {imageModels.map((imageModel) => (
                <option key={imageModel.id} value={imageModel.id}>
                  {imageModel.id}
                </option>
              ))}
            </select>
            <select value={imageSize} onChange={(e) => setImageSize(e.target.value)}>
              <option value="1024x1024">Square(1:1) - 1024x1024</option>
              <option value="1920x1080">Landscape(16:9) - 1920x1080</option>
              <option value="1080x1920">Portrait(9:16) - 1080x1920</option>
              <option value="1024x768">Landscape(4:3) - 1024x768</option>
              <option value="768x1024">Portrait(3:4) - 768x1024</option>
            </select>

            <ImageDownloader />
          </div>

          <textarea
            className="app-input"
            placeholder={placeholder}
            onChange={(e) => setPrompt(e.target.value)}
            rows="10"
            cols="40"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                document.getElementById("generate").click();
              }
            }}
          />
          <label htmlFor="quantity">Number of Images:</label>
          <input id="quantity" type="range" min="1" max={maxQuantity} value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value))} />
          <span>{quantity}</span>

          <br />
          <button onClick={handleButtonClick} id="generate">
            Generate Images
          </button>
          <DisplayImages />
        </>
      )}
    </div>
  );
}

export default App;
