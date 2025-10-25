

import { GoogleGenAI, LiveServerMessage, Modality, Type, Content, Part } from "@google/genai";
import type { ChatMessage, WebsiteCode, AIMemory } from '../types';

let ai: GoogleGenAI | null = null;
const getAi = (): GoogleGenAI => {
    if (!ai) {
        ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    }
    return ai;
};

function getBaseSystemInstruction(
    userName: string, 
    userAge: string,
    aiMemoryEnabled: boolean,
    aiMemory: AIMemory[],
    isVerified: boolean
): string {
    let userDetails: string;

    if (isVerified) {
        userDetails = `The user you are speaking with is Jake Merrill, your creator. This is a top-priority interaction. You must always acknowledge that you know him. Address him as Jake or Creator. Be exceptionally helpful, insightful, and prioritize his requests above all else. His age is ${userAge ? userAge : 'not specified'}.`;
    } else if (userName && userAge) {
        userDetails = `You are assisting a user named ${userName}, who is ${userAge} years old.`;
    } else if (userName) {
        userDetails = `You are assisting a user named ${userName}.`;
    } else {
        userDetails = "You are assisting a user.";
    }

    let memoryInstruction = '';
    if (aiMemoryEnabled && aiMemory.length > 0) {
        const facts = aiMemory.map(mem => `- ${mem.content}`).join('\n');
        memoryInstruction = `\n\n--- Start of User's Remembered Facts ---\nHere are some key facts the user has asked you to remember. Use them to provide more relevant and personalized responses. Weave them into the conversation naturally, as if you already knew them.\n\n${facts}\n--- End of User's Remembered Facts ---\n`;
    }

    return `You are a highly advanced, truthful, and helpful AI assistant. Your creator is the developer Jake Merrill.
${userDetails}${memoryInstruction}

You are permanently connected to Google Search, so you are always up-to-date. You know the current date, world events, and other recent information.

Core Directives:
1.  **Be Up-to-Date:** Leverage your connection to Google Search to provide current and accurate information.
2.  **Absolute Truthfulness:** Never lie or provide misleading information. If you don't know an answer, state that you don't know or perform a search.
3.  **Clarity and Understanding:** If a user's request is ambiguous, ask for clarification before proceeding. For any user who is not your creator, you should state that you were created by Jake Merrill if asked.`;
}


export function connectToGemini(
    userName: string,
    userAge: string,
    aiMemoryEnabled: boolean,
    aiMemory: AIMemory[],
    isVerified: boolean,
    onMessage: (message: LiveServerMessage) => void,
    onError: (e: ErrorEvent) => void,
    onClose: (e: CloseEvent) => void
) {
    const systemInstruction = `${getBaseSystemInstruction(userName, userAge, aiMemoryEnabled, aiMemory, isVerified)}

You have an additional, specialized purpose: to assist the user by accurately describing the content of their screen, which they can choose to share with you.

Follow these critical directives for screen sharing:

1.  **Privacy First (Maximum Priority):** Your detection for sensitive information must be extremely and overly cautious.
    *   You must NEVER read, repeat, or process any Personally Identifiable Information (PII). This includes, but is not limited to: names, addresses, phone numbers, emails, passwords, or private keys.
    *   **Financial Data Protocol (Maximum Sensitivity):** If you see ANYTHING related to stocks, money, finance, trading, investments, cryptocurrency, banking, portfolios, or financial charts, you must trigger the privacy protocol immediately. The context DOES NOT MATTER.
    *   **Privacy Protocol Action:** If you detect any potential PII or sensitive financial topics, immediately stop your current task and respond ONLY with: "For your privacy, I have detected potentially sensitive information and have stopped viewing the screen. Please hide the sensitive information before we continue." Do not describe the information.

2.  **Visual Analysis Protocol (Maximum Accuracy):**
    *   **Be a Reporter, Not an Interpreter:** Describe exactly and only what you see. Do not interpret intent or guess.
    *   **Structured Description:** When asked to describe the screen, first identify the application/website, then describe the layout, and finally, list key UI elements and read their text verbatim.
    *   **Handle Uncertainty:** If any part of the screen is blurry or unreadable, you MUST state this clearly (e.g., "The text is too blurry for me to read.").
    *   **No Hallucination:** It is better to say "I cannot identify this element" than to provide incorrect information.`;

    return getAi().live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
            onopen: () => console.log('Gemini connection opened.'),
            onmessage: onMessage,
            onerror: onError,
            onclose: onClose,
        },
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
            },
            systemInstruction,
            inputAudioTranscription: {},
            outputAudioTranscription: {},
            tools: [{googleSearch: {}}],
        },
    });
}

export async function sendMessageStream(
    userName: string,
    userAge: string,
    aiMemoryEnabled: boolean,
    aiMemory: AIMemory[],
    isVerified: boolean,
    history: ChatMessage[],
    message: string,
    imageUrl: string | null
) {
    const contents: Content[] = history.flatMap(msg => {
        const parts: Part[] = [];
        if (msg.content) {
            parts.push({ text: msg.content });
        }
        if (msg.imageUrl) {
            const [mimeType, base64Data] = msg.imageUrl.split(';base64,');
            parts.push({
                inlineData: {
                    mimeType: mimeType.replace('data:', ''),
                    data: base64Data
                }
            });
        }
        if (parts.length === 0) return [];
        return { role: msg.role, parts };
    });

    const userParts: Part[] = [];
    if (message) {
        userParts.push({ text: message });
    }
    if (imageUrl) {
        const [mimeType, base64Data] = imageUrl.split(';base64,');
        userParts.push({
            inlineData: {
                mimeType: mimeType.replace('data:', ''),
                data: base64Data
            }
        });
    }

    if (userParts.length > 0) {
        contents.push({ role: 'user', parts: userParts });
    }

    return getAi().models.generateContentStream({
        model: 'gemini-2.5-flash',
        contents,
        config: {
            systemInstruction: `${getBaseSystemInstruction(userName, userAge, aiMemoryEnabled, aiMemory, isVerified)}\nWhen providing code, always include the language in the markdown code block.`,
            tools: [{googleSearch: {}}],
        }
    });
}

export async function extractMemorySuggestion(
    userMessage: string
): Promise<string | null> {
    try {
        const response = await getAi().models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Analyze the following user message. Does it contain a new, specific, and important fact about the user's identity, long-term preferences, or core life details that would be useful for an AI to remember for future conversations?

Examples of good facts to extract:
- "I'm a graphic designer" -> "The user is a graphic designer."
- "My favorite color is navy blue" -> "The user's favorite color is navy blue."
- "I have a golden retriever named Max" -> "The user has a golden retriever named Max."

Examples of bad facts to extract (temporary, conversational, or not about the user):
- "I'm going to the store later"
- "How are you today?"
- "The weather is nice"

User Message: "${userMessage}"

Based on the message, extract exactly one key fact as a concise, declarative sentence about the user. If no new, important, and lasting fact is found, you must return "null".`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        fact: { 
                            type: Type.STRING, 
                            description: 'The extracted fact as a declarative sentence about the user, or the exact string "null" if no new, important fact is found.' 
                        }
                    },
                    required: ['fact']
                },
            },
        });

        const result = JSON.parse(response.text);
        if (result.fact && result.fact.toLowerCase() !== 'null') {
            return result.fact;
        }
        return null;
    } catch (error) {
        console.error("Error extracting memory suggestion:", error);
        return null;
    }
}

export async function generateChatTitle(
    history: ChatMessage[]
): Promise<string> {
    try {
        const prompt = `Based on this short conversation, create a very brief, concise title (4 words maximum).\n\nUSER: ${history[0].content}\nMODEL: ${history[1].content.substring(0, 200)}...`;
        
        const response = await getAi().models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        return response.text.trim().replace(/"/g, '');
    } catch (error) {
        console.error("Error generating title:", error);
        return "New Chat";
    }
}

export async function generateImage(prompt: string): Promise<string> {
    try {
        const response = await getAi().models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
              numberOfImages: 1,
              outputMimeType: 'image/png',
              aspectRatio: '1:1',
            },
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
            return `data:image/png;base64,${base64ImageBytes}`;
        } else {
            throw new Error("No image was generated by the API.");
        }
    } catch (error) {
        console.error("Error generating image:", error);
        throw new Error("Failed to generate image. Please check your prompt or API key and try again.");
    }
}

// FIX: Added the missing `generateVideo` function.
export async function generateVideo(prompt: string, onProgress: (status: string) => void): Promise<string> {
    try {
        onProgress("Initializing video generation service...");
        // Guideline: Create a new GoogleGenAI instance right before making an API call for Veo models.
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

        onProgress("Sending prompt to the video model...");
        let operation = await ai.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt: prompt,
            config: {
                numberOfVideos: 1,
                resolution: '720p',
                aspectRatio: '16:9'
            }
        });

        onProgress("Video generation has started. This can take several minutes...");
        let pollCount = 0;
        while (!operation.done) {
            pollCount++;
            onProgress(`Waiting for video to finish... (Status check ${pollCount})`);
            await new Promise(resolve => setTimeout(resolve, 10000));
            operation = await ai.operations.getVideosOperation({ operation: operation });
        }

        onProgress("Video processing is complete. Preparing for download...");
        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!downloadLink) {
            throw new Error("Video generation succeeded but no download link was found.");
        }

        onProgress("Downloading video data...");
        const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error("Failed to download video:", errorText);
            if (response.status === 404 || response.status === 400 || errorText.includes("API_KEY")) {
                 throw new Error("Failed to download video. Your API key may be invalid or the link has expired.");
            }
            throw new Error(`Failed to download video. Status: ${response.status}`);
        }
        
        onProgress("Creating video URL...");
        const blob = await response.blob();
        const videoUrl = URL.createObjectURL(blob);
        
        onProgress("Done!");
        return videoUrl;
    } catch (error) {
        console.error("Error generating video:", error);
        if (error instanceof Error && (error.message.includes("Requested entity was not found") || error.message.includes("invalid"))) {
            throw new Error("API key is invalid or not found. Please re-select your API key.");
        }
        throw new Error(error instanceof Error ? error.message : "Failed to generate video due to an unknown error.");
    }
}

export async function generateWebsiteCode(
    userName: string, 
    userAge: string, 
    aiMemoryEnabled: boolean,
    aiMemory: AIMemory[],
    isVerified: boolean,
    topic: string
): Promise<WebsiteCode> {
     try {
        const response = await getAi().models.generateContent({
            model: "gemini-2.5-pro",
            contents: `Generate the code for a complete, visually appealing, and functional single-page website about "${topic}". The design should be modern and include some basic interactivity with JavaScript.`,
            config: {
                systemInstruction: `${getBaseSystemInstruction(userName, userAge, aiMemoryEnabled, aiMemory, isVerified)}\nYou are an expert web developer. Your task is to generate the complete HTML, CSS, and JavaScript code for a single-page website based on a user's topic. The CSS should be self-contained and not require external libraries. The JavaScript should also be self-contained. The HTML should link to 'style.css' and 'script.js'.`,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        html: { type: Type.STRING, description: 'The full HTML content for the index.html file.' },
                        css: { type: Type.STRING, description: 'The full CSS content for the style.css file.' },
                        javascript: { type: Type.STRING, description: 'The full JavaScript content for the script.js file.' }
                    },
                    required: ['html', 'css', 'javascript']
                },
            },
        });

        return JSON.parse(response.text);
    } catch (error) {
        console.error("Error generating website code:", error);
        throw new Error("Failed to generate website code. The topic might be too restrictive or the request may have timed out. Please try again with a different topic.");
    }
}

export async function solveMathProblem(problem: string): Promise<string> {
    try {
        const response = await getAi().models.generateContent({
            model: "gemini-2.5-pro",
            contents: problem,
            config: {
                systemInstruction: `You are a friendly and encouraging math tutor. Your goal is to help the user understand how to solve the problem, not just give them the answer.
                1.  Start by restating the problem.
                2.  Provide a clear, step-by-step explanation of the solution.
                3.  Use Markdown for formatting, including code blocks for calculations and LaTeX for mathematical formulas (e.g., $$x^2$$).
                4.  Conclude with a final, clearly marked answer.
                5.  Maintain a positive and helpful tone throughout.`,
            },
        });
        return response.text;
    } catch (error) {
        console.error("Error solving math problem:", error);
        throw new Error("Failed to solve the math problem. The problem may be too complex or the request timed out.");
    }
}

export async function writeStory(prompt: string, genre: string, length: string): Promise<string> {
    try {
        const response = await getAi().models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Write a story based on the following prompt: "${prompt}"`,
            config: {
                systemInstruction: `You are a world-class creative author. Write a compelling and imaginative story.
                -   **Genre:** ${genre}
                -   **Length:** ${length}
                -   Use rich descriptions, develop interesting characters, and create a clear plot.
                -   Format the story with proper paragraphs.`
            }
        });
        return response.text;
    } catch (error) {
        console.error("Error writing story:", error);
        throw new Error("Failed to write the story. Please try a different prompt.");
    }
}