import aiHelper from "../../helpers/AIHelper.js";

class FlashcardsController {
    async generateFlashcard(req, res) {
        try {
            const { flDocsId, fileUrl, extension } = req.body;

            if (!flDocsId || !fileUrl || !extension) {
                return res.status(400).json({
                    success: false,
                    message: "Missing metadata",
                });
            }

            const data = await aiHelper.generateFlashcard(flDocsId, fileUrl, extension);

            return res.status(200).json({
                success: true,
                message: "Generate content of flashcard successfully",
                data: data,
            });
        } catch (error) {
            console.error("Error generating flashcard:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to generate flashcard",
                error: error.message,
            });
        }
    }
}

export default new FlashcardsController();