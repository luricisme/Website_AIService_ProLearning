import { DynamicStructuredTool } from "langchain/tools";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { AgentExecutor, createToolCallingAgent } from "langchain/agents";
import { z } from "zod";

import AIHelper from "./AIHelper.js";

class AIAgent {
    constructor() {
        if (AIAgent.instance) {
            return AIAgent.instance;
        }

        this.aiHelper = AIHelper;
        this.agentExecutor = null;

        // LLM for AI Agent
        this.llm = new ChatGoogleGenerativeAI({
            model: "gemini-2.0-flash",
            temperature: 0,
            apiKey: process.env.GOOGLE_API_KEY,
        });

        AIAgent.instance = this;
    }

    async initAgent() {
        if (this.agentExecutor) return this.agentExecutor;

        // Tool 01: Summarize file
        const summarizeTool = new DynamicStructuredTool({
            name: "summarize_document",
            description: "Summarize a document from URL. Supports PDF, DOCX, TXT, PPTX files.",
            schema: z.object({
                fileUrl: z.string().describe("The URL of the document to summarize (required)"),
                extension: z.enum(["pdf", "docx", "txt", "pptx"]).describe("File extension (required)"),
                noteDocsId: z.string().min(1).describe("Document ID (required)"),
            }),
            func: async ({ fileUrl, extension, noteDocsId }) => {
                try {
                    const summary = await this.aiHelper.summarizeNoteByChain(noteDocsId, fileUrl, extension);
                    return `🐻‍❄️ Document summarized successfully:\n\n${summary}`;
                } catch (error) {
                    return `😡 Error summarizing document: ${error.message}`;
                }
            },
        });

        // Tool 02: Explain Text
        const explainTool = new DynamicStructuredTool({
            name: "explain_text",
            description: "Explain a specific text or concept with given context. Useful for answering questions about highlighted content.",
            schema: z.object({
                context: z.string().describe("Background context or full text content"),
                queryText: z.string().describe("The specific text or question to explain"),
            }),
            func: async ({ context, queryText }) => {
                try {
                    const explanation = await this.aiHelper.explainNote(context, queryText);
                    return `🐻‍❄️ Explanation:\n\n${explanation}`;
                } catch (error) {
                    return `😡 Error explaining text: ${error.message}`;
                }
            },
        });

        const tools = [summarizeTool, explainTool];

        // Create prompt
        const prompt = ChatPromptTemplate.fromMessages([
            [
                "system",
                `You are an AI assistant for a learning platform called "Pro Learning". Your role is to help students with:
                    - Summarizing educational documents (PDF, DOCX, TXT, PPTX)
                    - Explaining highlighted text and concepts
                    - Answering questions about study materials
                    - Performing calculations when needed

                    Use the available tools to assist users effectively. Be concise, clear, and educational in your responses.`
            ],
            ["human", "{input}"],
            ["placeholder", "{agent_scratchpad}"],
        ]);

        // Create agent
        const agent = await createToolCallingAgent({
            llm: this.llm,
            tools,
            prompt,
        });

        this.agentExecutor = new AgentExecutor({
            agent,
            tools,
            verbose: true,
            maxIterations: 5,
            returnIntermediateSteps: true,
        });

        return this.agentExecutor;
    }

    /**
     * Run agent with user input
     * @param {string} input - User's question or request
     * @returns {Promise<object>} - Agent response with output and steps
    */
    async run(input) {
        try {
            const executor = await this.initAgent();

            const result = await executor.invoke({
                input: input,
            });

            return {
                success: true,
                output: result.output,
                steps: result.intermediateSteps || [],
            };
        } catch (error) {
            console.error("Agent error:", error);
            return {
                success: false,
                error: error.message,
                output: "Sorry, I encountered an error while processing your request.",
            };
        }
    }

    /**
     * Run agent with streaming (optional)
     * @param {string} input - User's question or request
     * @param {Function} onToken - Callback for each token
    */
    async runStream(input, onToken) {
        try {
            const executor = await this.initAgent();

            const stream = await executor.stream({
                input: input,
            });

            let fullOutput = "";

            for await (const chunk of stream) {
                if (chunk.output) {
                    fullOutput += chunk.output;
                    if (onToken) onToken(chunk.output);
                }
            }

            return {
                success: true,
                output: fullOutput,
            };
        } catch (error) {
            console.error("Agent streaming error:", error);
            return {
                success: false,
                error: error.message,
            };
        }
    }
}

const instance = new AIAgent();
export default instance;