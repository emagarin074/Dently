const http = require("http");
http
  .get("http://localhost:3000/api/icon/Smile", (res) => {
    console.log("Status:", res.statusCode);
    res.on("data", (d) => console.log("Data chunk length:", d.length));
    res.on("end", () => console.log("Done"));
  })
  .on("error", (e) => console.error(e));
