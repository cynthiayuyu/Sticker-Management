
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function suggestStickerNames(theme: string): Promise<string[]> {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `請根據主題「${theme}」為一套含有 40 張貼圖的系列建議名稱。
    格式請回傳 JSON 陣列，包含 40 個簡短、有趣且符合繁體中文語境的貼圖標籤（例如：你好、加油、辛苦了、早安...等）。
    風格要優雅且具有設計感。`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.STRING
        }
      }
    }
  });

  try {
    return JSON.parse(response.text.trim());
  } catch (e) {
    console.error("Failed to parse AI response", e);
    return [];
  }
}
