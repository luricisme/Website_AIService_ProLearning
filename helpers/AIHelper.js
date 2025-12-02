import { GoogleGenerativeAI } from '@google/generative-ai';

import { WebPDFLoader } from "@langchain/community/document_loaders/web/pdf";
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";
import { PPTXLoader } from "@langchain/community/document_loaders/fs/pptx";
import { TextLoader } from "langchain/document_loaders/fs/text";

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { Document } from "@langchain/core/documents";

import fs from "fs";
import path from "path";

class AIHelper {
  constructor() {
    // Use Singleton Pattern
    if (AIHelper.instance) {
      return AIHelper.instance;
    }

    this.model = 'gemini-2.0-flash';

    // Root SDK
    this.ai = new GoogleGenerativeAI({
      apiKey: process.env.GOOGLE_API_KEY,
    });

    // Wrapper of LangChain
    this.llm = new ChatGoogleGenerativeAI({
      model: this.model,
      temperature: 0,
      apiKey: process.env.GOOGLE_API_KEY,
    });

    // Temp dir to handle load file
    this.tempDir = './temp';
    if (!fs.existsSync(this.tempDir)) fs.mkdirSync(this.tempDir);

    AIHelper.instance = this;
  }

  // NOTE
  async explainNote(allUnformattedAns, queryText, lang) {
    // Define prompt
    const prompt = PromptTemplate.fromTemplate(`
      You are an assistant that explains highlighted text from user notes.
      ### Based on this information that queries from the documents:
      {allUnformattedAns}

      ### Task:
      Explain the following text briefly and clearly in {lang} language:
      "{queryText}".

      Formatting rules:
      - Use **only** the following HTML tags: <p>, <strong>, <b>, <em>, <i>.
      - Do not use any other HTML tags (no <div>, <span>, <ul>, etc.).
      - Keep your explanation under 80 words.
      - Avoid repeating the question.
      - Be concise and direct.
      `);

    const formattedPrompt = await prompt.format({
      allUnformattedAns,
      lang,
      queryText
    });
    // console.log("FORMATTED PROMPT: ", formattedPrompt);

    const messages = [
      new SystemMessage("You are a helpful assistant."),
      new HumanMessage(formattedPrompt),
    ];

    const response = await this.llm.invoke(messages);

    const text = response.content || "No text returned";

    return text.trim();
  }

  async summarizeNoteByChain(assetId, fileUrl, extension, lang, limit) {
    const docs = await this.loadFile(assetId, fileUrl, extension);

    // Define prompt
    const prompt = PromptTemplate.fromTemplate(`
      You are an assistant that summarizes documents.

      ### Task:
      Summarize the main themes in the following documents clearly and concisely in {lang} language:
      {context}

      ### Formatting rules:
      - Use only these HTML tags: <p>, <strong>, <b>, <em>, <i>.
      - Do not use any other HTML tags (no <div>, <span>, <ul>, <ol>, <li>, <table>, etc.).
      - Do not include code block markers like \`\`\`html or \`\`\`.
      - Keep the summary under {limit} words.
      - Write in a natural, readable tone.
    `);

    // Instantiate
    const chain = await createStuffDocumentsChain({
      llm: this.llm,
      outputParser: new StringOutputParser(),
      prompt,
    });

    let result = await chain.invoke({ context: docs, lang: lang, limit: limit });
    result = result.replace(/```html|```/gi, "").trim();
    result = result.replace(/<(?!\/?(p|strong|b|em|i)\b)[^>]*>/gi, "");

    // console.log("Summarize File: ", result);
    return result;
  }

  // FLASHCARD
  async generateFlashcardByFile(assetId, fileUrl, extension) {
    const docs = await this.loadFile(assetId, fileUrl, extension);

    // Define prompt
    const prompt = PromptTemplate.fromTemplate(`
      You are an assistant that extracts key concepts from a document and converts them into flashcards.

      ### Task:
      Read the entire document below and extract ALL important concepts and definitions.
      Your flashcards MUST fully represent the document's content with no missing key ideas.
      
      Return them strictly in the following format:
      Word1|Definition1;Word2|Definition2;Word3|Definition3

      ### Hard rules:
      - Output ONLY the flashcard pairs in the exact format above.
      - No explanations, no notes, no extra text.
      - No markdown, no HTML, no quotes.
      - Each "Word" is a meaningful concept from the document.
      - Each "Definition" must accurately and completely reflect the intended meaning from the file.
      - Include as many flashcards as needed to cover the entire document. 
      - Ensure the flashcards collectively represent **all key information** in the document.

      ### Document:
      {context}
    `);

    // Instantiate
    const chain = await createStuffDocumentsChain({
      llm: this.llm,
      outputParser: new StringOutputParser(),
      prompt,
    });

    let result = await chain.invoke({ context: docs });

    result = result
      .replace(/```[^`]*```/g, "") // remove fenced code blocks
      .replace(/```/g, "")
      .replace(/<[^>]*>/g, "") // remove any HTML if model produced
      .trim();

    // console.log("Summarize File: ", result);
    return result;
  }

  async generateFlashcardByNote(content) {
    // Define prompt
    const prompt = PromptTemplate.fromTemplate(`
      You are an assistant that extracts key concepts from a HTML content and converts them into flashcards.

      ### Task:
      Read the main information in the body tag below and extract ALL important concepts and definitions.
      Your flashcards MUST fully represent the document's content with no missing key ideas.
      
      Return them strictly in the following format:
      Word1|Definition1;Word2|Definition2;Word3|Definition3

      ### Hard rules:
      - Output ONLY the flashcard pairs in the exact format above.
      - No explanations, no notes, no extra text.
      - No markdown, no HTML, no quotes.
      - Each "Word" is a meaningful concept from the document.
      - Each "Definition" must accurately and completely reflect the intended meaning from the file.
      - Include as many flashcards as needed to cover the entire document. 
      - Ensure the flashcards collectively represent **all key information** in the document.

      ### Document:
      {context}
    `);

    // Instantiate
    const chain = await createStuffDocumentsChain({
      llm: this.llm,
      outputParser: new StringOutputParser(),
      prompt,
    });

    // Format input template
    const docs = [
      new Document({ pageContent: content })
    ];

    let result = await chain.invoke({ context: docs });

    result = result
      .replace(/```[^`]*```/g, "") // remove fenced code blocks
      .replace(/```/g, "")
      .replace(/<[^>]*>/g, "") // remove any HTML if model produced
      .trim();

    // console.log("Summarize File: ", result);
    return result;
  }

  async loadFile(docsId, fileUrl, extension) {
    // console.log("Extension: ", extension);
    const supportedExtensions = ["pdf", "docx", "txt", "pptx"];

    // Validate extension
    if (!supportedExtensions.includes(extension)) {
      throw new Error(`Unsupported file type: ${extension}. Supported: ${supportedExtensions.join(", ")}`);
    }

    // Fetch file from URL
    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();

    let loader;
    let tempPath = null;
    try {
      if (extension === "pdf") {
        // PDF can be loaded directly from Blob
        loader = new WebPDFLoader(
          new Blob([arrayBuffer], { type: "application/pdf" })
        );
      } else {
        // Other formats need temporary file
        tempPath = path.join(
          this.tempDir,
          `${Date.now()}_${docsId}.${extension}`
        );
        fs.writeFileSync(tempPath, Buffer.from(arrayBuffer));

        // Select appropriate loader
        const loaders = {
          docx: DocxLoader,
          txt: TextLoader,
          pptx: PPTXLoader,
        };

        const LoaderClass = loaders[extension];
        loader = new LoaderClass(tempPath);
      }

      const docs = await loader.load();
      return docs;

    } finally {
      // Clean up temporary file
      if (tempPath && fs.existsSync(tempPath)) {
        try {
          fs.unlinkSync(tempPath);
        } catch (error) {
          console.error(`Failed to delete temp file ${tempPath}:`, error);
        }
      }
    }
  }
}

const instance = new AIHelper();
Object.freeze(instance);

export default instance;
