class TestController {
    async helloWorld(req, res) {
        return res.status(200).json({
            success: true,
            message: "Hello World",
        });
    }
}

module.exports = new TestController();