
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { Persona, GenerationSettings, ScriptLine, CommunicationStyle, ExpertiseLevel, SentenceLength, VocabComplexity, HumorLevel, PersonaAnalysisResult } from '../types';
import { COMMUNICATION_STYLES, EXPERTISE_LEVELS, HUMOR_LEVELS, PERSONALITY_TRAIT_OPTIONS, SENTENCE_LENGTHS, VOCAB_COMPLEXITIES } from "../constants";

if (!process.env.API_KEY) {
    // In a real app, this would be a fatal error.
    // For this environment, we will mock it if missing.
    console.warn("API_KEY environment variable not set. Using mock data.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "mock-key" });

const mockScript: ScriptLine[] = [
    { id: '1', speakerId: '0', line: 'Welcome, everyone! Today, we\'re diving into a fascinating topic: the future of renewable energy. To start, what\'s the biggest misconception people have about solar power?' },
    { id: '2', speakerId: '1', line: 'That\'s a great question. I think the most common myth is that solar is only viable in constantly sunny climates. The reality is, modern panels are incredibly efficient and can generate significant power even on overcast days. The technology has come a long way.' },
    { id: '3', speakerId: '0', line: 'That\'s a critical point. So it\'s more about the technology\'s efficiency than just raw sunlight?' },
    { id: '4', speakerId: '1', line: 'Exactly. It\'s about the annual average of solar irradiance, not just having perfect blue skies. Plus, advancements in battery storage are solving the intermittency problem, making it a truly reliable power source.' },
];

/**
 * Safely decodes a base64 string, supporting UTF-8 characters.
 * @param base64 The base64 string to decode.
 * @returns The decoded string, or an empty string if decoding fails.
 */
const decodeBase64 = (base64: string): string => {
    try {
        // Use TextDecoder for robust UTF-8 support
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return new TextDecoder().decode(bytes);
    } catch (e) {
        console.error("Failed to decode base64 string:", e);
        return "";
    }
}

export const generateIntroSuggestion = async (personas: Persona[]): Promise<string> => {
    if (!process.env.API_KEY) {
        const names = personas.map(p => p.name).join(', ');
        const andNames = names.replace(/,([^,]*)$/, ' and$1');
        return new Promise(resolve => setTimeout(() => resolve(
`In this conversation I speak with ${andNames}. They are experts in various interesting fields. In this conversation we discuss:
- A very interesting topic synthesized from their documents.
- Another key point that will surely engage the audience.
- A third, crucial discussion point.
- The future implications of their combined knowledge.
- How these ideas challenge common perceptions.

And with that, here's the conversation with ${andNames}.`
        ), 1500));
    }

    const personaSummary = personas.map(p => {
        const details = [
            `${p.name} (${p.role})`,
            `an expert in ${p.expertiseLevel.toLowerCase()} level topics`,
            p.personalityTraits.length > 0 ? `with traits like ${p.personalityTraits.join(', ')}` : '',
            p.motivations ? `motivated by ${p.motivations}` : '',
            `Their knowledge base includes: ${p.sourceDocuments.map(d => d.name).join(', ') || 'general knowledge'}`
        ].filter(Boolean).join(', ');
        return `- ${details}`;
    }).join('\n');


    const allSources = personas.flatMap(p => p.sourceDocuments.map(d => `--- Document: ${d.name} for speaker ${p.name} ---\n${d.content}\n--- End Document ---`)).join('\n\n');

    const prompt = `
        You are an expert podcast producer. Your task is to write a compelling introduction for a show segment based on the speakers and their source materials.

        SPEAKERS:
        ${personaSummary}

        SOURCE MATERIALS:
        ${allSources}

        TASK:
        Write a conversational introduction for a podcast episode. The intro must follow this structure:
        1.  Introduce the speakers by name.
        2.  Briefly state their general area of expertise.
        3.  Create a bulleted list of 5-7 interesting and specific topics that will be discussed. These topics MUST be synthesized from the provided source materials. The topics should be intriguing and make someone want to listen.
        4.  Provide a concluding sentence to transition into the main conversation.

        OUTPUT FORMAT:
        Return only the text of the introduction. Do not include any other explanations or markdown formatting.

        EXAMPLE:
        In this conversation I speak with Dr. Evelyn Reed and Ben Carter. They are experts in artificial intelligence and cognitive science. In this conversation we discuss:
        - The surprising ways AI models mimic human cognitive dissonance.
        - How to frame questions to get unbiased opinions from language models.
        - The philosophical limits of what a large language model can "know".
        - Using strategic anthropomorphism to improve AI interaction.
        - Uncovering and understanding the vulnerabilities in model responses.

        And with that, here's the conversation with Evelyn and Ben.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: { temperature: 0.6 }
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error generating intro suggestion from Gemini:", error);
        throw new Error("Failed to generate an intro suggestion. The AI service may be temporarily unavailable.");
    }
};


const parseAndValidateResponse = (text: string, personas: Persona[]): ScriptLine[] => {
    let jsonStr = text.trim();
    const fenceRegex = /^```(?:json)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[1]) {
        jsonStr = match[1].trim();
    }

    try {
        const parsedData = JSON.parse(jsonStr);
        if (Array.isArray(parsedData)) {
            const validSpeakerIds = new Set(personas.map(p => p.id));
            return parsedData.map((item: any, index: number) => ({
                id: `${Date.now()}-${index}`,
                speakerId: String(item.speakerId),
                line: item.line || '',
            })).filter(item => validSpeakerIds.has(item.speakerId));
        }
        throw new Error("Parsed data is not an array.");
    } catch (e) {
        console.error("Failed to parse JSON response:", e);
        console.error("Raw response text:", text);
        throw new Error("The AI returned an invalid script format. Please try generating again.");
    }
};

const getPersonaPromptDetails = (p: Persona): string => {
    const details = [
        `- Name/Role: ${p.name} / ${p.role}`,
        `- Style: ${p.communicationStyle}, ${p.expertiseLevel} expertise.`,
        `- Personality: ${p.personalityTraits.join(', ')}.`,
        p.emotionalRange && `- Emotional Range: ${p.emotionalRange}.`,
        p.motivations && `- Motivations: ${p.motivations}.`,
        p.quirks && `- Quirks: ${p.quirks}.`,
        p.deeperCharsContextFile && `- Deeper characteristics are also informed by a provided ${p.deeperCharsContextFile.type} file named "${p.deeperCharsContextFile.name}".`,
        `- Speaking Patterns: ${p.speakingPatterns.sentenceLength} sentences, ${p.speakingPatterns.vocabularyComplexity} vocabulary, ${p.speakingPatterns.humorLevel} humor.`,
        p.speakingPatterns.commonPauses && `- Common Pauses: ${p.speakingPatterns.commonPauses}.`,
        p.speakingPatterns.fillerWords && `- Filler Words: ${p.speakingPatterns.fillerWords}.`,
        p.speakingPatterns.speechImpediments && `- Speech Impediments: ${p.speakingPatterns.speechImpediments}.`
    ];
    return details.filter(Boolean).join('\n');
}

export const generateScript = async (
    personas: Persona[],
    settings: GenerationSettings,
    showIntro: string
): Promise<ScriptLine[]> => {
    
    // Mock for development without API key
    if (!process.env.API_KEY) {
        return new Promise(resolve => setTimeout(() => resolve(mockScript.map(line => ({...line, speakerId: personas[parseInt(line.speakerId)]?.id || '0'}))), 2000));
    }

    const personaDescriptions = personas.map((p, index) => {
        let speakingContext = '';
        const contextFile = p.speakingPatterns.speakingContextFile;
        if (contextFile) {
            if (contextFile.type.startsWith('text/')) {
                const fileContent = decodeBase64(contextFile.data.split(',')[1] || '');
                if (fileContent) {
                    speakingContext = `\nReference for speaking style from "${contextFile.name}":\n---\n${fileContent}\n---`;
                }
            } else {
                // For PDF or other types, just mention the file
                speakingContext = `\nTheir speaking style is also informed by a provided file: "${contextFile.name}".`;
            }
        }

        const sourceDocs = p.sourceDocuments.length > 0
            ? `Knowledge Base for ${p.name} (MUST draw from these sources):\n` + p.sourceDocuments.map((doc, i) =>
                `--- Document ${i+1}: ${doc.name} ---\n${doc.content}\n--- End Document ${i+1} ---`
              ).join('\n\n')
            : `No specific source documents provided for ${p.name}. Base dialogue on their general persona characteristics (e.g., ask questions, facilitate).`;
        
        const personaDetails = getPersonaPromptDetails(p);


        return (
`Persona ${index} (id: ${p.id}):
${personaDetails}
${speakingContext}
${sourceDocs}`
        );
    }).join('\n\n');

    const prompt = `
        You are an expert scriptwriter AI. Your task is to transform provided source materials into a natural, engaging dialogue script based on defined speaker personas and a show introduction.

        CONTEXT:
        1.  **Show Introduction**: This is the introduction that precedes the dialogue. The dialogue you generate should flow naturally from this intro. DO NOT repeat the intro. The first line of dialogue should be the start of the conversation.
            --- BEGIN INTRO ---
            ${showIntro}
            --- END INTRO ---

        2.  **Speaker Personas & Their Knowledge Base**: You must strictly adhere to the persona descriptions provided. Each line of dialogue must reflect the assigned speaker's style, expertise, personality, AND be grounded in the information from THEIR OWN source documents. This includes mimicking their specific speaking patterns like filler words, pauses, and any impediments. If a persona has no documents, their dialogue should be based on their general persona characteristics, often asking questions or facilitating the conversation.
            ${personaDescriptions}

        3.  **Source Material Interaction**: The conversation should be a dynamic exchange where speakers reference, build upon, or challenge points from their respective source materials. Do not simply have each speaker summarize their documents in turn. Create a real conversation.

        4.  **Generation Settings**:
            - Desired Dialogue Length: Approximately ${settings.dialogueLengthInMinutes} minutes of spoken dialogue. This is a guideline; focus on a natural conversation flow that respects this length.
            - Conversation Style: ${settings.conversationStyle}
            - Complexity: ${settings.complexityLevel}

        TASK:
        Generate a dialogue script based on the context above. The dialogue should begin immediately after the provided intro, with the first speaker starting the conversation.

        OUTPUT FORMAT:
        You MUST return a valid JSON array of objects. Each object in the array represents a single line of dialogue and must have the following structure:
        {
          "speakerId": "string",  // The ID of the persona speaking (e.g., "${personas[0]?.id || 'some_id'}")
          "line": "string"        // The text of the dialogue line.
        }

        Example:
        [
          { "speakerId": "${personas[0]?.id || 'persona-id-0'}", "line": "Drawing from my research on solar efficiency, the latest panels are not as reliant on direct sunlight as one might think." },
          { "speakerId": "${personas[1]?.id || 'persona-id-1'}", "line": "That's interesting, because my sources on grid management highlight the storage problem. How do we reconcile those two points?" }
        ]

        Do not include any explanations or introductory text outside of the JSON array. The entire response must be the JSON data itself.
    `;
    
    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                temperature: 0.75,
                // Use responseSchema for structured JSON output
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            speakerId: {
                                type: Type.STRING,
                            },
                            line: {
                                type: Type.STRING,
                            },
                        },
                        required: ["speakerId", "line"],
                    },
                },
            }
        });

        const responseText = response.text;
        return parseAndValidateResponse(responseText, personas);
    } catch (error) {
        console.error("Error generating script from Gemini:", error);
        throw new Error("Failed to communicate with the AI service. Please check your connection and API key.");
    }
};

export const reviseLineWithPrompt = async (
    lineIdToRevise: string,
    userPrompt: string,
    script: ScriptLine[],
    personas: Persona[]
): Promise<string> => {
    if (!process.env.API_KEY) {
        const originalLine = script.find(l => l.id === lineIdToRevise)?.line || '';
        return new Promise(resolve => setTimeout(() => resolve(`(Revised based on: "${userPrompt}") ${originalLine}`), 1500));
    }

    const lineToRevise = script.find(l => l.id === lineIdToRevise);
    if (!lineToRevise) {
        throw new Error("Line to revise not found in script.");
    }

    const speakerOfLine = personas.find(p => p.id === lineToRevise.speakerId);
    if (!speakerOfLine) {
        throw new Error("Speaker of the line not found.");
    }
    
    const scriptHistory = script.map(line => {
        const speakerName = personas.find(p => p.id === line.speakerId)?.name || 'Unknown';
        const isCurrentLine = line.id === lineIdToRevise ? " (<<< THIS LINE)" : "";
        return `${speakerName}: ${line.line}${isCurrentLine}`;
    }).join('\n');

    const personaDetails = getPersonaPromptDetails(speakerOfLine);

    const prompt = `
        You are an expert script editor. Your task is to revise a single line of dialogue based on a user's instruction, while maintaining the conversational context and the speaker's persona.

        FULL SCRIPT CONTEXT:
        (The line to revise is marked with '<<< THIS LINE')
        ${scriptHistory}

        SPEAKER PERSONA FOR THE LINE BEING REVISED:
        ${personaDetails}

        INSTRUCTION:
        Revise the line "${lineToRevise.line}" based on this user instruction: "${userPrompt}"

        OUTPUT:
        Return ONLY the revised line of dialogue as a plain text string. Do not include the speaker's name, markdown, or any other explanatory text.
    `;
    
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: { temperature: 0.7 }
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error revising line with Gemini:", error);
        throw new Error("Failed to revise the line using AI.");
    }
};

export const generateNextLine = async (
    script: ScriptLine[],
    personas: Persona[]
): Promise<ScriptLine> => {
    if (!process.env.API_KEY) {
        const lastSpeakerId = script.length > 0 ? script[script.length - 1].speakerId : personas[0].id;
        const lastSpeakerIndex = personas.findIndex(p => p.id === lastSpeakerId);
        const nextSpeakerIndex = (lastSpeakerIndex + 1) % personas.length;
        const nextSpeaker = personas[nextSpeakerIndex];
        return new Promise(resolve => setTimeout(() => resolve({
            id: `${Date.now()}`,
            speakerId: nextSpeaker.id,
            line: 'This is a contextually generated next line based on the previous statement.'
        }), 1500));
    }
    
    const lastSpeakerId = script.length > 0 ? script[script.length - 1].speakerId : null;
    let nextSpeaker: Persona;

    if (personas.length === 0) {
        throw new Error("No personas available to generate a line for.");
    }

    if (personas.length === 1) {
        nextSpeaker = personas[0];
    } else if (lastSpeakerId) {
        const lastSpeakerIndex = personas.findIndex(p => p.id === lastSpeakerId);
        const nextSpeakerIndex = (lastSpeakerIndex + 1) % personas.length;
        nextSpeaker = personas[nextSpeakerIndex];
    } else {
        nextSpeaker = personas[0];
    }
    
    if (!nextSpeaker) {
        throw new Error("Could not determine the next speaker.");
    }

    const personaDescriptions = personas.map(p => {
        const personaDetails = getPersonaPromptDetails(p);

        return (
`Persona (id: ${p.id}):
${personaDetails}`
        );
    }).join('\n\n');

    const scriptHistory = script.slice(-10).map(line => {
        const speakerName = personas.find(p => p.id === line.speakerId)?.name || 'Unknown';
        return `${speakerName}: ${line.line}`;
    }).join('\n');

    const prompt = `
        You are an expert scriptwriter AI. Your task is to generate the very next line of dialogue in an ongoing conversation, ensuring it is a natural continuation.

        RECENT CONVERSATION HISTORY (last 10 lines):
        ${scriptHistory}

        SPEAKER PERSONAS:
        ${personaDescriptions}

        TASK:
        The last speaker was ${script.length > 0 ? (personas.find(p=>p.id === script[script.length-1].speakerId)?.name || 'Unknown') : 'no one'}.
        The next line should be spoken by **${nextSpeaker.name} (id: ${nextSpeaker.id})**.
        Write a single, natural, and context-aware line of dialogue for them. The line must be consistent with their persona (including specific speaking patterns) and the flow of the conversation.

        OUTPUT FORMAT:
        You MUST return a valid JSON object with ONLY a "line" property.
        Example:
        {
          "line": "And how does that connect back to the initial findings you mentioned?"
        }
    `;
    
    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                temperature: 0.8,
                // Use responseSchema for structured JSON output
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        line: { type: Type.STRING },
                    },
                    required: ["line"],
                },
            }
        });

        const responseText = response.text;
        let jsonStr = responseText.trim();
        const fenceRegex = /^```(?:json)?\s*\n?(.*?)\n?\s*```$/s;
        const match = jsonStr.match(fenceRegex);
        if (match && match[1]) {
            jsonStr = match[1].trim();
        }

        const parsedData = JSON.parse(jsonStr);

        if (parsedData && typeof parsedData.line === 'string') {
            return {
                id: `${Date.now()}`,
                speakerId: nextSpeaker.id,
                line: parsedData.line.trim(),
            };
        }
        throw new Error("AI returned an invalid data format for the next line.");

    } catch (error) {
        console.error("Error generating next line from Gemini:", error);
        throw new Error("Failed to generate the next line using AI.");
    }
};

export const analyzeTranscriptForPersona = async (transcript: string): Promise<PersonaAnalysisResult> => {
    if (!process.env.API_KEY) {
        return new Promise(resolve => setTimeout(() => resolve({
            name: 'Analyzed Speaker',
            role: 'Expert from Audio',
            communicationStyle: CommunicationStyle.ANALYTICAL,
            expertiseLevel: ExpertiseLevel.EXPERT,
            personalityTraits: ['Pragmatic', 'Curious'],
            speakingPatterns: {
                sentenceLength: SentenceLength.LONG,
                vocabularyComplexity: VocabComplexity.COMPLEX,
                humorLevel: HumorLevel.NONE,
                fillerWords: 'so, basically',
            }
        }), 2000));
    }

    const prompt = `
        You are a personality and speech pattern analyst. Your task is to analyze a text transcript of someone speaking and create a persona profile for them. Based on the transcript, infer their communication style, expertise level, personality traits, and speaking patterns.

        TRANSCRIPT:
        "${transcript}"

        TASK:
        Analyze the transcript and provide a persona profile. Infer the following characteristics:
        - **name**: A plausible name for the speaker. If none can be inferred, use a generic placeholder like "Speaker 1".
        - **role**: A plausible role or profession for the speaker.
        - **communicationStyle**: One of [${COMMUNICATION_STYLES.join(', ')}].
        - **expertiseLevel**: One of [${EXPERTISE_LEVELS.join(', ')}].
        - **personalityTraits**: An array of 2-4 relevant traits from this list: [${PERSONALITY_TRAIT_OPTIONS.join(', ')}].
        - **speakingPatterns**: An object containing:
          - **sentenceLength**: One of [${SENTENCE_LENGTHS.join(', ')}].
          - **vocabularyComplexity**: One of [${VOCAB_COMPLEXITIES.join(', ')}].
          - **humorLevel**: One of [${HUMOR_LEVELS.join(', ')}].
          - **fillerWords**: A comma-separated string of any filler words you detect (e.g., "um, like, you know").

        OUTPUT FORMAT:
        Return a valid JSON object matching the schema provided. Do not include any other text or explanations.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                temperature: 0.5,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        role: { type: Type.STRING },
                        communicationStyle: { type: Type.STRING, enum: COMMUNICATION_STYLES },
                        expertiseLevel: { type: Type.STRING, enum: EXPERTISE_LEVELS },
                        personalityTraits: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING }
                        },
                        speakingPatterns: {
                            type: Type.OBJECT,
                            properties: {
                                sentenceLength: { type: Type.STRING, enum: SENTENCE_LENGTHS },
                                vocabularyComplexity: { type: Type.STRING, enum: VOCAB_COMPLEXITIES },
                                humorLevel: { type: Type.STRING, enum: HUMOR_LEVELS },
                                fillerWords: { type: Type.STRING, description: "A comma-separated list of filler words detected." },
                            },
                        },
                    },
                }
            }
        });

        const parsedText = response.text.trim();
        const parsedData = JSON.parse(parsedText);
        
        // Basic validation
        if (typeof parsedData !== 'object' || parsedData === null) {
            throw new Error("AI returned invalid data format.");
        }
        
        return parsedData as PersonaAnalysisResult;

    } catch (error) {
        console.error("Error analyzing transcript with Gemini:", error);
        throw new Error("Failed to analyze the transcript using AI.");
    }
};