import { httpServer } from "./app.js";
import { HOST, PORT } from "./config.js";

httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT} \n http://${HOST}:${PORT}`);
});