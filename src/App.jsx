import React, { useState, useEffect } from "react";
import "./App.css";
import { DisplayImages } from "./Images";
import ImageDownloader from "./ImagesDownload";

//Add for translation
function isEnglish(text) {
  return /^[A-Za-z]*$/.test(text);
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
        "model": "gpt-3.5-turbo",
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
    console.log(contentdata);
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
  const [placeholder, setPlaceholder] = useState("Search Bears with Paint Brushes the Starry Night, painted by Vincent Van Gogh...");
  const [quantity, setQuantity] = useState(5);
  const [imageSize, setImageSize] = useState("1024x1024");
  const [selectedImageSize, setSelectedImageSize] = useState(imageSize);
  const [model, setModel] = useState("sdxl");
  const [maxQuantity, setMaxQuantity] = useState(5);
  const [buttonClicked, setButtonClicked] = useState(false);

  const [imageModels, setImageModels] = useState([]);

  useEffect(() => {
    const fetchImageModels = async () => {
      const apiUrl = `${import.meta.env.VITE_OPEN_AI_BASE}/v1/models`;
      try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        const imageModels = data.data.filter((model) => model.max_images);
        setImageModels(imageModels);
      } catch (error) {
        console.error("Error fetching image models:", error);
      }
    };

    fetchImageModels();
  }, []);

  const generateImage = async () => {
    setRequestError(false);
    setImageSize(selectedImageSize);
    setPlaceholder(`Search ${prompt}...`);
    setPrompt(prompt);
    setLoading(true);

    const apiUrl = `${import.meta.env.VITE_OPEN_AI_BASE}/v1/images/generations`;
    const openaiApiKey = import.meta.env.VITE_OPEN_AI_KEY;
    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: model,
          prompt: prompt,
          n: quantity,
          size: imageSize,
        }),
      });

      if (!response.ok) {
        setRequestError(true);
        const errorMessage = await response.json();
        setRequestErrorMessage(await errorMessage.error.message);
      }

      const data = await response.json();

      setLoading(false);

      const existingLinks = JSON.parse(localStorage.getItem("imageLinks")) || [];

      const newLinks = data.data.map((image) => image.url);
      const allLinks = [...newLinks, ...existingLinks];

      localStorage.setItem("imageLinks", JSON.stringify(allLinks));
    } catch (error) {
      setLoading(false);
      console.log(error);
    }
  };

  useEffect(() => {
    if (buttonClicked) {
      // Call the generateImage function
      generateImage();
      // Reset buttonClicked state
      setButtonClicked(false);
    }
  }, [buttonClicked]);

  async function handleButtonClick() {
    // Get the input text
    const text = prompt;
      
    // Check if the text is English
    try {
      const translatedText = await translate(`translate below text to English, and reply the translated text only: ${text}`);
      console.log(translatedText);
      setPrompt(translatedText);
      // Set buttonClicked state to true
      setButtonClicked(true);
    } catch (error) {
      console.error('Error during translation:', error);
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

          <h2>Generate Images using Different AI Models</h2>
          <div className="select-container">
            <select value={model} onChange={handleModelSelect}>
            {imageModels.map((imageModel) => (
                <option key={imageModel.id} value={imageModel.id}>
                  {imageModel.id}
                </option>
              ))}
            </select>
            <select value={selectedImageSize} onChange={(e) => setSelectedImageSize(e.target.value)}>
              <option value="1024x1024">Square(1:1) - 1024x1024</option>
              <option value="1920x1080">Landscape(16:9) - 1920x1080</option>
              <option value="1080x1920">Portrait(9:16) - 1080x1920</option>
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
