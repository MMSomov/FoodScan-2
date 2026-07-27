import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Resolve paths for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  // Cloud Run передает свой PORT в process.env.PORT (обычно 8080)
  const PORT = Number(process.env.PORT) || 8080;

  // Setup body parsing with reasonable size limits for base64 images
  app.use(express.json({ limit: "15mb" }));
  app.use(express.urlencoded({ limit: "15mb", extended: true }));

  // Initialize Gemini client lazily/safely
  const getGeminiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      throw new Error("GEMINI_API_KEY is not configured. Please add it in your Settings > Secrets panel.");
    }
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  };

  // API Endpoint: Analyze food label/ingredients
  app.post("/api/analyze", async (req, res) => {
    try {
      const { text, image, mimeType } = req.body;
      const ai = getGeminiClient();

      if (!text && !image) {
        return res.status(400).json({ error: "Please provide either an ingredient list text or an image of an ingredient label." });
      }

      let contents: any[] = [];
      let systemInstruction = `You are an expert food safety toxicologist, clinical nutritionist, and dietary specialist. 
Your goal is to thoroughly scan and analyze ingredient labels of food products.
Identify:
1. Potential Allergens (e.g., dairy, peanuts, gluten, soy, etc.)
2. Potential Harm & Additive Health Risks (e.g., gut disruption, metabolic impact, behavior issues, toxicity)
3. Carcinogenicity (e.g., known carcinogens like Potassium Bromate, Titanium Dioxide, synthetic food dyes, BHA/BHT, artificial sweeteners linked to risk, or WHO/IARC hazard levels)
4. Provide Healthy Alternatives / Substitutes for each harmful ingredient detected, and general product replacements.

Be extremely objective, accurate, and rigorous. Do not sugarcoat synthetic additives or toxic compounds. If an ingredient is safe and nutritious, classify it as "safe".
Your response MUST comply strictly with the provided JSON schema. Ensure all fields are filled, and health scores are appropriately low for ultra-processed food and high for clean food.`;

      if (image) {
        // Trim any base64 headers like 'data:image/jpeg;base64,' if present
        const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
        const imageMime = mimeType || "image/jpeg";

        contents.push({
          inlineData: {
            mimeType: imageMime,
            data: base64Data,
          },
        });

        contents.push(
          "Analyze this image of an ingredient label. Extract the brand/product name if visible and analyze every ingredient listed on the label according to your system instructions."
        );
      } else {
        contents.push(
          `Analyze the following food product / list of ingredients:\n\n${text}`
        );
      }

      console.log("Sending analysis request to Gemini model 'gemini-3.6-flash'...");

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              productName: {
                type: Type.STRING,
                description: "Name/Brand or descriptive category of the food product analyzed."
              },
              healthScore: {
                type: Type.INTEGER,
                description: "Overall health score from 0 (extremely hazardous/ultra-processed) to 100 (100% natural, whole food, nutritious). Be strict: discount score heavily for artificial dyes, high-fructose corn syrup, toxic preservatives, and hydrogenated oils."
              },
              overallSummary: {
                type: Type.STRING,
                description: "A summary explaining the score, general safety assessment, the density of processed components, and critical safety highlights."
              },
              allergens: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "A comprehensive checklist of allergens present (e.g., Gluten, Wheat, Dairy, Soy, Peanuts, Tree Nuts, Eggs, Shellfish, Fish, Sesame, Corn, Yeast)."
              },
              dietaryFlags: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    profile: { type: Type.STRING, description: "Common profile like Vegan, Vegetarian, Gluten-Free, Dairy-Free, Low-FODMAP, Keto, Halal, Paleo" },
                    compatible: { type: Type.BOOLEAN, description: "True if perfectly suitable, false if it contains ingredients violating this diet." },
                    reason: { type: Type.STRING, description: "Brief justification specifying which ingredients cause incompatibility, or why it is healthy." }
                  },
                  required: ["profile", "compatible", "reason"]
                }
              },
              ingredients: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING, description: "Name of the ingredient (e.g. 'Yellow 5', 'Sodium Benzoate', 'Organic Oats')." },
                    status: {
                      type: Type.STRING,
                      description: "Safety status rating.",
                      enum: ["safe", "caution", "hazardous"]
                    },
                    category: { type: Type.STRING, description: "Classification e.g. Artificial Color, Preservative, Thickener, Sweetener, Whole Food, Natural Mineral." },
                    carcinogenicity: {
                      type: Type.STRING,
                      description: "Carcinogenic status/risks e.g. 'None', 'Suspected (linked to cancer in animal trials)', 'Banned in Europe as possible carcinogen', 'Classified Group 2B by IARC'."
                    },
                    harmDetails: { type: Type.STRING, description: "Detailed health risks, e.g., 'linked to ADHD in children', 'disrupts gut microbiomes', 'causes spikes in insulin', 'perfectly safe antioxidant'." },
                    healthyAlternatives: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: "Natural, healthy ingredient alternatives that can be used instead of this ingredient."
                    }
                  },
                  required: ["name", "status", "category", "carcinogenicity", "harmDetails", "healthyAlternatives"]
                }
              },
              generalSwaps: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING, description: "A healthier ready-made product brand or specific organic alternative (e.g. 'Organic fruit-infused sparkling water' instead of diet soda)." },
                    description: { type: Type.STRING, description: "Brief explanation of why this swap is superior." }
                  },
                  required: ["name", "description"]
                }
              }
            },
            required: ["productName", "healthScore", "overallSummary", "allergens", "dietaryFlags", "ingredients", "generalSwaps"]
          }
        }
      });

      const analysisText = response.text;
      if (!analysisText) {
        throw new Error("Received empty response from the analysis engine.");
      }

      const parsedData = JSON.parse(analysisText);
      res.json(parsedData);
    } catch (error: any) {
      console.error("Analysis Error:", error);
      res.status(500).json({
        error: error.message || "An unexpected error occurred during ingredient analysis. Please ensure your API key is correctly configured."
      });
    }
  });

  // Serve frontend files in development or production
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting in development mode with Vite middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting in production mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Food Label Analyzer Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();