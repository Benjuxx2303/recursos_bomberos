import app from "./app.js";
import { PORT, HOST } from "./config.js";

app.listen(PORT);
console.log(`Server running on port ${PORT} \n http://${HOST}:${PORT}`);