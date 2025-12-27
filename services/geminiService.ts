import { GoogleGenAI, Type } from "@google/genai";
import { GeneratedPassword, PasswordComplexity } from "../types";

// Initialize Gemini Client
// The 'process.env.API_KEY' string is replaced by Vite during build time with the actual key.
// We cast to string to satisfy TypeScript.
const apiKey = (process.env.API_KEY as string) || '';
const ai = new GoogleGenAI({ apiKey: apiKey });

const MODEL_NAME = 'gemini-3-flash-preview';

export const generatePasswordWithGemini = async (inputWord: string, complexity: PasswordComplexity): Promise<GeneratedPassword[]> => {
  // Check if key is valid (not empty)
  if (!apiKey) {
    console.warn("API Key missing. Returning fallback mock data.");
    return mockGenerate(inputWord, complexity);
  }

  try {
    let strategyInstruction = '';
    switch (complexity) {
      case 'easy':
        strategyInstruction = `
          Focus on memorability and ease of typing. 
          Use the input word(s) clearly. 
          Use simple separators like '-' or '.' or capitalized words (CamelCase).
          Avoid confusing characters.
          Example strategies: "Word-Word-123", "Word.Word24".
        `;
        break;
      case 'cool':
        strategyInstruction = `
          Make the password look "cool" or "hacker-style" using Leetspeak.
          Substitute letters with numbers/symbols (e.g., E->3, A->4, S->$, T->7, O->0).
          Keep the core word recognizable but stylized.
          Example strategies: "W0rd_P4ss!", "xX_Word_Xx".
        `;
        break;
      case 'hard':
        strategyInstruction = `
          Focus on maximum security and entropy.
          Break the word apart, insert random characters, mix upper/lower case unpredictably.
          Use special characters heavily.
          The result should be very hard to guess.
        `;
        break;
    }

    const prompt = `
      Create 3 distinct passwords based on the keyword: "${inputWord}".
      
      Complexity Preference: ${complexity.toUpperCase()}
      
      Strategy:
      ${strategyInstruction}
      
      Ensure they are at least 12 characters long if possible.
      Provide a strength rating and a brief explanation of why it fits the "${complexity}" style.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              password: { type: Type.STRING },
              strength: { type: Type.STRING, enum: ['Weak', 'Medium', 'Strong'] },
              explanation: { type: Type.STRING }
            },
            required: ['password', 'strength', 'explanation']
          }
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("Empty response from Gemini");
    
    return JSON.parse(jsonText) as GeneratedPassword[];

  } catch (error) {
    console.error("Gemini API Error:", error);
    return mockGenerate(inputWord, complexity); // Fallback if API fails
  }
};

// Fallback generator if API key is invalid or network fails
const mockGenerate = (word: string, complexity: PasswordComplexity): GeneratedPassword[] => {
  const cleanWord = word.replace(/\s/g, '');
  
  if (complexity === 'easy') {
    return [
      {
        password: `${cleanWord.charAt(0).toUpperCase() + cleanWord.slice(1)}-2024`,
        strength: 'Medium',
        explanation: 'Simple capitalization with year appended.'
      },
      {
        password: `${cleanWord.toLowerCase()}.${cleanWord.toUpperCase()}!`,
        strength: 'Strong',
        explanation: 'Repeated word with separator.'
      },
      {
        password: `My-${cleanWord}-Pass`,
        strength: 'Medium',
        explanation: 'Easy to read sentence structure.'
      }
    ];
  } else if (complexity === 'cool') {
    return [
      {
        password: `xX_${cleanWord}_Xx`,
        strength: 'Medium',
        explanation: 'Gaming tag style.'
      },
      {
        password: `${cleanWord.replace(/a/g, '4').replace(/e/g, '3').replace(/i/g, '1')}!`,
        strength: 'Strong',
        explanation: 'Basic leetspeak substitution.'
      },
      {
        password: `_$${cleanWord.toUpperCase()}$_`,
        strength: 'Strong',
        explanation: 'Wrapped in currency symbols.'
      }
    ];
  } else {
    // Hard
    return [
      {
        password: `9#${cleanWord.slice(0, 2)}Xy${cleanWord.slice(2)}!m`,
        strength: 'Strong',
        explanation: 'Broken word with injected entropy.'
      },
      {
        password: `${cleanWord.split('').reverse().join('')}$92#K`,
        strength: 'Strong',
        explanation: 'Reversed word with suffix.'
      },
      {
        password: `Qz-${cleanWord}-77&`,
        strength: 'Strong',
        explanation: 'Random prefix/suffix.'
      }
    ];
  }
};