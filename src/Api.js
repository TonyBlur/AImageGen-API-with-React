export const fetchImageModels = async () => {
  const apiUrl = `${import.meta.env.VITE_OPEN_AI_BASE}/v1/models`;
  const openaiApiKey = import.meta.env.VITE_OPEN_AI_KEY;

  try {
    const response = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${openaiApiKey}`,
      },
    });
    const data = await response.json();
    const imageModels = data.data.filter((model) => model.max_images && model.id);
    return imageModels;
  } catch (error) {
    console.error("Error fetching image models:", error);
    return [];
  }
};

export const generateImage = async (model, prompt, quantity, imageSize) => {
  const apiUrl = `${import.meta.env.VITE_OPEN_AI_BASE}/v1/images/generations`;
  const openaiApiKey = import.meta.env.VITE_OPEN_AI_KEY;

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
      width: imageSize.split("x")[0],
      height: imageSize.split("x")[1],
    }),
  });

  return response;
};
