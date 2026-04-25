import { GoogleGenAI } from "@google/genai";

const getAI = (): GoogleGenAI | null => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

const ai = getAI();

export const geminiService = {
  async getDesignTip(style: string) {
    if (!ai) {
      return "กรุณาตั้งค่า API Key เพื่อรับคำแนะนำการออกแบบ";
    }
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Please provide a professional architectural and interior design tip for a ${style} style house. Keep it concise (max 2 sentences). Reply in Thai.`,
      });
      return response.text || "ไม่สามารถดึงข้อมูลได้ในขณะนี้";
    } catch (error) {
      console.error("Gemini Error:", error);
      return "ไม่สามารถดึงข้อมูลได้ในขณะนี้";
    }
  }
};
