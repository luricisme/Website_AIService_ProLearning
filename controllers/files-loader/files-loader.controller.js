import { WebPDFLoader } from "@langchain/community/document_loaders/web/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import SupabaseHelper from "../../helpers/supabaseHelper.js";

class FilesLoaderController {
    async pdfLoader(req, res) {
        try {
            
            const { noteId, fileName, fileUrl } = req.body;
            if (!noteId || !fileName || !fileUrl) {
                return res.status(400).json({
                    success: false,
                    message: "Missing metadata",
                });
            }

            // TODO: Xử lý nhiều file ở đây sau
            // 1. Load the PDF file
            // Fix get direct PDF file URL: 
            // https://support.cloudinary.com/hc/en-us/articles/360016480179-Why-are-PDF-or-ZIP-files-appearing-in-the-Media-Library-but-their-download-URLs-return-an-error
            const response = await fetch(fileUrl);
            const arrayBuffer = await response.arrayBuffer();
            const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
            const loader = new WebPDFLoader(blob);
            const docs = await loader.load();

            let pdfTextContent = '';

            docs.forEach(doc => {
                pdfTextContent = pdfTextContent + doc.pageContent;
            });

            // 2. Split the text into small chunks
            const splitter = new RecursiveCharacterTextSplitter({
                chunkSize: 100,
                chunkOverlap: 20,
            });
            const output = await splitter.createDocuments([pdfTextContent]);

            let splitterList = [];
            output.forEach(doc => {
                splitterList.push(doc.pageContent)
            });

            const supabaseHelper = new SupabaseHelper();
            await supabaseHelper.addDocuments(splitterList, {
                noteId,
                fileName,
            });

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