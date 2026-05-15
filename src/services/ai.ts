/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type } from "@google/genai";
import { WasteCategory } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function classifyWaste(base64Image: string, mimeType: string) {
  const model = "gemini-3-flash-preview";
  
  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        {
          inlineData: {
            mimeType,
            data: base64Image,
          },
        },
        {
          text: `Analyze this image and classify the waste item for recycling.
          Return a JSON object with exactly these fields:
          {
            "category": string (must be one of: plastic, glass, paper, metal, cardboard, trash),
            "confidence": number (0 to 1),
            "instructions": string (step-by-step recycling guide),
            "tips": string (eco-friendly tip related to this item)
          }`,
        },
      ],
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          category: { type: Type.STRING, description: "One of: plastic, glass, paper, metal, cardboard, trash" },
          confidence: { type: Type.NUMBER },
          instructions: { type: Type.STRING },
          tips: { type: Type.STRING }
        },
        required: ["category", "confidence", "instructions", "tips"]
      }
    }
  });

  return JSON.parse(response.text) as {
    category: WasteCategory;
    confidence: number;
    instructions: string;
    tips: string;
  };
}

export async function getEcoChatResponse(message: string, history: { role: 'user' | 'assistant', content: string }[]) {
  const model = "gemini-3-flash-preview";
  
  const chat = ai.chats.create({
    model,
    config: {
      systemInstruction: "You are EcoSort AI, a smart recycling assistant for Kazakhstan. You are expert in waste management, sustainability, and local recycling rules in Astana. Be helpful, enthusiastic about the environment, and concise. If asked about where to recycle, refer to local points in Astana like EcoCenter, Green Point, or RecyclePro.",
    },
    // We can't pass history directly to sendMessage, so we use the chat object
  });

  // Note: Standard @google/genai chat doesn't support easy history insertion in one go without 'contents' in generateContent
  // But we can just use generateContent for simple single turn or build a context string.
  // For simplicity and following guidelines, we'll use generateContent with history as part of the prompt if needed, 
  // or just use the chat API if it supports it.
  
  const contents = [
    ...history.map(h => ({
      role: h.role === 'user' ? 'user' : 'model',
      parts: [{ text: h.content }]
    })),
    { role: 'user', parts: [{ text: message }] }
  ];

  const response = await ai.models.generateContent({
    model,
    contents: contents as any,
    config: {
      systemInstruction: "You are EcoSort AI, a smart recycling assistant for Kazakhstan. You are expert in waste management, sustainability, and local recycling rules in Astana. Be helpful, enthusiastic about the environment, and concise. If asked about where to recycle, refer to local points in Astana like EcoCenter, Green Point, or RecyclePro.",
    }
  });

  return response.text;
}

export async function generateAvatar(displayName: string) {
  const model = "gemini-2.5-flash-image";
  const prompt = `Create a unique, abstract, artistic avatar for a user named '${displayName}'. 
  Theme: Environmentalism, circular economy, and nature.
  Visual Style: High-quality, clean, minimalist abstract vector art. Think geometric shapes, flowing organic lines, or stylized natural motifs.
  Color Palette: Vibrant greens, deep teals, earthy browns, and sunny yellows.
  Mood: Innovative, positive, and sustainable.
  Constraints: No text, no realistic human faces, no complex backgrounds. Centered composition. Square aspect ratio.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        }
      }
    });

    const parts = response.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
  } catch (error) {
    console.error("Error generating avatar:", error);
  }
  return null;
}
