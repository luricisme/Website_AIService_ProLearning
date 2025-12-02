import aiHelper from "../../helpers/AIHelper.js";

class FlashcardsController {
    async generateFlashcardByFile(req, res) {
        try {
            const { assetId, fileUrl } = req.body;

            if (!assetId || !fileUrl) {
                return res.status(400).json({
                    success: false,
                    message: "Missing fields in payload",
                });
            }

            const extension = fileUrl.split('.').pop().toLowerCase();
            const data = await aiHelper.generateFlashcardByFile(assetId, fileUrl, extension);

            return res.status(200).json({
                success: true,
                message: "Generate content of flashcard by file successfully",
                data: data,
            });
        } catch (error) {
            console.error("Error generating flashcard by file:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to generate flashcard by file",
                error: error.message,
            });
        }
    }

    async generateFlashcardByNote(req, res) {
        try {
            const { content } = req.body;

            if (!content) {
                return res.status(400).json({
                    success: false,
                    message: "Missing fields in payload",
                });
            }

            const data = await aiHelper.generateFlashcardByNote(content);

            return res.status(200).json({
                success: true,
                message: "Generate content of flashcard by note successfully",
                data: data,
            });
        } catch (error) {
            console.error("Error generating flashcard by note:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to generate flashcard by note",
                error: error.message,
            });
        }
    }
}

export default new FlashcardsController();