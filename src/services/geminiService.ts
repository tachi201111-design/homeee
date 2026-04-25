import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const geminiService = {
  async getDesignTip(style: string) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Please provide a professional architectural and interior design tip for a ${style} style house. Keep it concise (max 2 sentences). Reply in Thai.`,
      });
      return response.text;
    } catch (error) {
      console.error("Gemini Error:", error);
      return "ไม่สามารถดึงข้อมูลได้ในขณะนี้";
    }
  }
};
