import { GoogleGenAI, Chat, Content, Type, HarmCategory, HarmBlockThreshold } from "@google/genai";
import type { InterviewData, ChatMessage, User, TestQuestion, UserAnswer, TestResult } from '../types';
import { languages } from '../i18n';

let ai: GoogleGenAI | null = null;

const getAiClient = (): GoogleGenAI => {
  if (!ai) {
    if (!process.env.API_KEY) {
      throw new Error("API_KEY is not set. Cannot initialize Gemini AI Client.");
    }
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return ai;
};

const model = 'gemini-2.5-flash';

const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

const convertMessagesToHistory = (messages: ChatMessage[]): Content[] => {
    return messages.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }],
    }));
}

const getSystemInstruction = (data: InterviewData, langCode: string, userProgress: User['progress']): string => {
  const languageName = languages.find(l => l.code === langCode)?.name || 'English';
  
  let difficultyInstruction = '';
  switch (userProgress) {
      case 'Intermediate':
          difficultyInstruction = 'The questions should be more challenging, requiring the candidate to provide specific examples and demonstrate deeper problem-solving skills (e.g., using the STAR method). Introduce one or two behavioral questions.';
          break;
      case 'Advanced':
          difficultyInstruction = "The interview should be tough, simulating a final-round or C-level interview. Ask complex, multi-part questions, challenge the candidate's assumptions, and probe deeply into their strategic thinking. Include situational and case-study style questions.";
          break;
      case 'Beginner':
      default:
          difficultyInstruction = "Keep the questions foundational and straightforward. Focus on getting to know the candidate's background and basic qualifications. Ask about their resume and their motivation for the role.";
          break;
  }

  return `You are an expert hiring manager at ${data.companyName}. Your name is Alex. You are conducting a job interview for the ${data.jobRole} position. Your goal is to assess the candidate's skills, experience, and cultural fit for ${data.companyName}.

Your entire conversation, including all questions and responses, MUST be in ${languageName}.

The candidate's current skill level is ${userProgress}. You must tailor the interview difficulty accordingly. ${difficultyInstruction}

Refer to the company's official website (${data.companyUrl}) to understand its mission, values, products, and recent news. Your tone and questions should reflect the company's culture. For example, if it's a fast-paced tech startup, be more dynamic and ask about innovation. If it's a traditional financial institution, be more formal and structured.

Begin the interview by introducing yourself and your role, then ask a strong, relevant opening question. Wait for the candidate's response before asking a logical follow-up. Maintain the context of the conversation. Do not break character. Do not mention that you are an AI. When the user skips a question, acknowledge it briefly and move to the next logical question.

The interview will consist of 3-5 questions. The candidate will signal the end of the interview by typing 'End Interview'.`;
};

export const initializeChat = async (
    interviewData: InterviewData, 
    language: string, 
    userProgress: User['progress'],
    history: ChatMessage[] = []
): Promise<{ chat: Chat; firstMessage?: string }> => {
  const client = getAiClient();
  const systemInstruction = getSystemInstruction(interviewData, language, userProgress);
  
  const chat = client.chats.create({
    model,
    config: {
      systemInstruction: systemInstruction,
      safetySettings,
    },
    history: convertMessagesToHistory(history),
  });

  if (history.length > 0) {
      // Resuming a chat, no first message needed
      return { chat };
  }

  const response = await chat.sendMessage({ message: "Please begin the interview now by introducing yourself and asking your first question." });
  
  return { chat, firstMessage: response.text };
};

export async function* continueChatStream(chat: Chat, message: string): AsyncGenerator<string> {
    const responseStream = await chat.sendMessageStream({ message });
    for await (const chunk of responseStream) {
        yield chunk.text;
    }
}

export const generateFeedback = async (chat: Chat, history: ChatMessage[]): Promise<string> => {
  const feedbackPrompt = `The candidate has concluded the interview by stating "End Interview". Based on our entire conversation history, please generate a comprehensive, narrative-style feedback report. Do not ask any more questions or continue the interview.

The report must be in the same language as the interview and have the following sections, clearly titled with "###":

### Overall Assessment
Provide a summary of the candidate's performance, suitability for the role, and cultural fit with the company.

### Key Strengths
List 2-3 specific strengths, providing direct examples or paraphrasing from the candidate's answers to support your points.

### Areas for Improvement
List 2-3 specific areas where the candidate could improve, again using concrete examples from the interview. Suggest actionable advice.

Your tone should be professional, constructive, and encouraging. Address the candidate directly in the second person (e.g., "Your response to...").`;
  
  const response = await chat.sendMessage({ message: feedbackPrompt });
  return response.text;
};

const testSchema = {
    type: Type.OBJECT,
    properties: {
        questions: {
            type: Type.ARRAY,
            description: 'An array of 3 multiple-choice questions.',
            items: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.STRING, description: 'A unique ID for the question (e.g., "q1").' },
                    question: { type: Type.STRING, description: 'The question text.' },
                    options: { type: Type.ARRAY, description: 'An array of 4 string options.', items: { type: Type.STRING } },
                },
                required: ['id', 'question', 'options'],
            }
        }
    },
    required: ['questions'],
};

export const generateTest = async (level: User['progress']): Promise<TestQuestion[]> => {
    const client = getAiClient();
    const prompt = `Based on a ${level}-level job interview for a generic corporate role (e.g., business, tech, marketing), generate a 3-question multiple-choice test to assess the candidate's core professional knowledge and situational judgment. The questions should be relevant to common workplace scenarios. Ensure options are distinct. Do not include the correct answer in your response.`;

    const response = await client.models.generateContent({
        model,
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: testSchema,
            safetySettings,
        },
    });

    const parsed = JSON.parse(response.text);
    return parsed.questions;
};

const gradingSchema = {
    type: Type.OBJECT,
    properties: {
        score: { type: Type.NUMBER, description: 'A score from 0 to 100 based on the correctness of the answers.' },
        passed: { type: Type.BOOLEAN, description: 'True if score is 70 or above.' },
        overallFeedback: { type: Type.STRING, description: 'A concise, constructive summary of the overall performance on the test. Address the user directly ("You did well on...").' },
        detailedFeedback: {
            type: Type.ARRAY,
            description: 'An array of feedback objects for each question answered.',
            items: {
                type: Type.OBJECT,
                properties: {
                    questionId: { type: Type.STRING, description: 'The ID of the question.' },
                    userAnswer: { type: Type.STRING, description: "The user's selected answer." },
                    isCorrect: { type: Type.BOOLEAN, description: 'Whether the user answer was correct.' },
                    feedback: { type: Type.STRING, description: 'A short explanation of why the answer is correct or incorrect.' },
                    correctAnswer: { type: Type.STRING, description: 'The text of the correct answer option.' },
                },
                required: ['questionId', 'userAnswer', 'isCorrect', 'feedback', 'correctAnswer'],
            },
        },
    },
    required: ['score', 'passed', 'overallFeedback', 'detailedFeedback'],
};

export const gradeTest = async (questions: TestQuestion[], answers: UserAnswer[]): Promise<TestResult> => {
    const client = getAiClient();
    const prompt = `A candidate has taken a test. Here are the questions with their options, and the candidate's answers. Please grade the test.

For each question, determine if the candidate's answer is correct. Then, provide a brief feedback explaining why the answer is correct or incorrect, and explicitly state the correct answer from the options.

Finally, calculate an overall score (percentage, where each question is weighted equally), determine if they passed (a score of 70% or higher is a pass), and write a short, overall feedback summary.

Questions and Options: ${JSON.stringify(questions)}
Candidate's Answers: ${JSON.stringify(answers)}

Return the complete result in the specified JSON format. Your grading should be based on a general understanding of professional best practices. The 'correctAnswer' you provide must be one of the options from the question.`;

    const response = await client.models.generateContent({
        model,
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: gradingSchema,
            safetySettings,
        },
    });
    
    return JSON.parse(response.text);
};

export const generateArticle = async (topic: string): Promise<string> => {
    const client = getAiClient();
    const prompt = `Write a short, insightful, and encouraging blog post (around 300 words) for a job seeker on the topic: "${topic}". 
    The tone should be professional yet approachable, like a career coach. 
    Use clear headings with markdown (e.g., "## Key Points") and bullet points or numbered lists where appropriate to make it easy to read. 
    Do not include a title in the output, just the article body.`;

    const response = await client.models.generateContent({
        model,
        contents: prompt,
        config: {
            safetySettings,
        },
    });
    return response.text;
};

export const generateArticleImage = async (topic: string): Promise<string> => {
    const client = getAiClient();
    const prompt = `A professional and abstract image representing the concept of "${topic}". 
    Minimalist, clean, vector art style with a corporate color palette (blues, grays, whites). 
    The image should be suitable as a header for a blog article on career advice. No text in the image.`;

    const response = await client.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt,
        config: {
            numberOfImages: 1,
            outputMimeType: 'image/jpeg',
            aspectRatio: '16:9',
        },
    });

    const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
    return `data:image/jpeg;base64,${base64ImageBytes}`;
};