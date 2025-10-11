import {
  GoogleGenAI,
} from '@google/genai';

class AIHelper {
  constructor() {
    if (AIHelper.instance) {
      return AIHelper.instance;
    }

    this.ai = new GoogleGenAI({
      apiKey: process.env.GOOGLE_API_KEY,
    });

    this.model = 'gemini-2.0-flash';

    AIHelper.instance = this;
  }

  async generateText(prompt) {
    const contents = [
      {
        role: 'user',
        parts: [{ text: prompt }],
      },
    ];

    const response = await this.ai.models.generateContent({
      model: this.model,
      contents,
    });

    console.log("Gemini full response:", JSON.stringify(response, null, 2));

    const text = response?.candidates?.[0]?.content?.parts?.[0]?.text || '⚠️ No text returned';

    return text.trim();
  }
}

const instance = new AIHelper();
Object.freeze(instance);

export default instance;
