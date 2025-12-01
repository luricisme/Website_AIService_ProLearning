import { WebPDFLoader } from "@langchain/community/document_loaders/web/pdf";
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";
import { PPTXLoader } from "@langchain/community/document_loaders/fs/pptx";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import supabaseHelper from "../../helpers/supabaseHelper.js";

import fs from "fs";
import path from "path";

// Here we handle: .txt, .pdf, .docx, .pptx
class FilesLoaderController {

    async fileLoader(req, res) {
        try {
            const { noteId, assetId, fileName, fileUrl } = req.body;

            // Validate required fields
            if (!noteId || !assetId || !fileName || !fileUrl) {
                return res.status(400).json({
                    success: false,
                    message: "Missing fields in payload",
                });
            }

            // Extract file extension
            const extension = fileUrl.split('.').pop().toLowerCase();
            const supportedExtensions = ["pdf", "docx", "txt", "pptx"];

            // Validate extension
            if (!supportedExtensions.includes(extension)) {
                throw new Error(
                    `Unsupported file type: ${extension}. Supported: ${supportedExtensions.join(", ")}`
                );
            }

            // Fetch file from URL
            const response = await fetch(fileUrl);
            if (!response.ok) {
                throw new Error(`Failed to fetch file: ${response.statusText}`);
            }

            const arrayBuffer = await response.arrayBuffer();
            let loader;
            const tempDir = './temp';
            let tempPath = null;

            try {
                // Load file based on extension
                if (extension === "pdf") {
                    // PDF can be loaded directly from Blob
                    loader = new WebPDFLoader(
                        new Blob([arrayBuffer], { type: "application/pdf" })
                    );
                } else {
                    // Other formats need temporary file
                    if (!fs.existsSync(tempDir)) {
                        fs.mkdirSync(tempDir, { recursive: true });
                    }

                    tempPath = path.join(
                        tempDir,
                        `${Date.now()}_${assetId}.${extension}`
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

                // Load and extract content
                const docs = await loader.load();
                const fileContent = docs.map(doc => doc.pageContent).join('');
                console.log("🐳 Loading file successfully");

                // Split the text into chunks
                const splitter = new RecursiveCharacterTextSplitter({
                    chunkSize: 100,
                    chunkOverlap: 20,
                });
                const output = await splitter.createDocuments([fileContent]);
                const splitterList = output.map(doc => doc.pageContent);

                // Store in database
                await supabaseHelper.addDocuments(splitterList, {
                    noteId: noteId,
                    assetId: assetId,
                    fileName,
                });

                console.log("🐳 Converting file to vector successfully");
                return res.status(200).json({
                    success: true,
                    message: "File processed successfully",
                    chunks: splitterList.length,
                });

            } finally {
                // Clean up temporary file
                if (tempPath && fs.existsSync(tempPath)) {
                    try {
                        fs.unlinkSync(tempPath);
                    } catch (error) {
                        console.error(`😡 Failed to delete temp file ${tempPath}:`, error);
                    }
                }
            }

        } catch (error) {
            console.error("😡 Error loading file and converting to vector:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to load file and convert to vector",
                error: error.message,
            });
        }
    }
}

export default new FilesLoaderController();