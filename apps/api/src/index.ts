import express from "express";

const app = express();
app.use(express.json());

app.get("/health-check", (req, res) => {
  res.json({
    message: "healthy",
  });
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
