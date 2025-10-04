import { WebPDFLoader } from "@langchain/community/document_loaders/web/pdf";
import axios from 'axios';
import fs from 'fs';

class FilesLoaderController {
    async pdfLoader(req, res) {
        try {
            // 1. Load the PDF file
            const { pdfUrl } = req.query;
            if (!pdfUrl) {
                return res.status(400).json({
                    success: false,
                    message: "Missing pdfUrl query parameter",
                });
            }

            // Fix get direct PDF file URL: https://support.cloudinary.com/hc/en-us/articles/360016480179-Why-are-PDF-or-ZIP-files-appearing-in-the-Media-Library-but-their-download-URLs-return-an-error
            const response = await fetch(pdfUrl);
            const arrayBuffer = await response.arrayBuffer();
            const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
            const loader = new WebPDFLoader(blob);
            const docs = await loader.load();

            

            return res.status(200).json({
                success: true,
                message: "Content in PDF File",
                results: docs,
            });

        } catch (error) {
            console.error("❌ Error loading PDF:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to load PDF",
                error: error.message,
            });
        }
    }
}

export default new FilesLoaderController();