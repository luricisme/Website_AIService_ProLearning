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
            const { noteDocsId, fileName, fileUrl, extension, noteId } = req.body;

            if (!noteDocsId || !fileName || !fileUrl || !extension || !noteId) {
                return res.status(400).json({
                    success: false,
                    message: "Missing metadata",
                });
            }

            // Read file from URL
            const response = await fetch(fileUrl);
            const arrayBuffer = await response.arrayBuffer();

            let loader;
            const tempDir = "./temp";
            let tempPath = '';
            if (extension === "pdf") {
                loader = new WebPDFLoader(new Blob([arrayBuffer], { type: "application/pdf" }));
            } else if (extension === "docx" || extension === "txt" || extension === "pptx") {
                if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
                tempPath = path.join(tempDir, `${Date.now()}_${fileName}`);
                fs.writeFileSync(tempPath, Buffer.from(arrayBuffer));

                if (extension === "docx") {
                    loader = new DocxLoader(tempPath);
                } else if (extension === "txt") {
                    loader = new TextLoader(tempPath);
                } else if(extension === "pptx"){
                    loader = new PPTXLoader(tempPath);
                }
            } else {
                return res.status(400).json({
                    success: false,
                    message: `Unsupported file type: ${extension}`,
                });
            }

            // Load and read
            const docs = await loader.load();
            let fileContent = '';
            docs.forEach(doc => {
                fileContent = fileContent + doc.pageContent;
            });
            // console.log("File content: " + fileContent);

            // 2. Split the text into small chunks
            const splitter = new RecursiveCharacterTextSplitter({
                chunkSize: 100,
                chunkOverlap: 20,
            });
            const output = await splitter.createDocuments([fileContent]);

            let splitterList = [];
            output.forEach(doc => {
                splitterList.push(doc.pageContent)
            });
            // console.log("Splitter List: " + splitterList);
            
            await supabaseHelper.addDocuments(splitterList, {
                noteDocsId,
                fileName,
                noteId,
            });

            // Delete temp file
            if (tempPath !== '') {
                console.log("Temp path: " + tempPath);
                fs.unlinkSync(tempPath);
            }

            return res.status(200).json({
                success: true,
                message: "File processed and converted to vector",
            });

        } catch (error) {
            console.error("❌ Error loading file and converting to vector:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to load file and convert to vector",
                error: error.message,
            });
        }
    }
}

export default new FilesLoaderController();