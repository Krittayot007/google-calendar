const express = require("express");
const app = express();
const cors = require("cors");
const calendarService = require("./calendar-service");
const { authenticate } = require("@google-cloud/local-auth");
const path = require("path");

const SCOPES = ["https://www.googleapis.com/auth/calendar"];
const CREDENTIALS_PATH = path.join(process.cwd(), "credentials.json");
const TOKEN_PATH = path.join(process.cwd(), "token.json");

app.use(cors());
app.use(express.json());
app.get("/", async (req, res, next) => {
  try {
    const client = await calendarService.loadSavedCredentialsIfExist();
    console.log(client, "client");
    if (client) {
      res.send("Authentication successful");
    } else {
      console.log("CREDENTIALS_PATH", CREDENTIALS_PATH);
      const newClient = await authenticate({
        scopes: SCOPES,
        keyfilePath: CREDENTIALS_PATH,
      });
      const data = req;
      console.log(data, "data");
      console.log(newClient, "newClient");
      if (newClient.credentials) {
        await calendarService.saveCredentials(newClient);
        res.send("Authentication successful");
      } else {
        res.status(500).send("Authentication failed");
      }
    }

    const clients = await calendarService.loadSavedCredentialsIfExist();
    if (!clients) {
      res.status(401).send("Authentication required");
      return;
    }
    await calendarService.listEvents(clients);
  } catch (error) {
    console.log(error);
    next(error);
  }
});

app.post("/create-event", async (req, res, next) => {
  const {
    summary,
    location,
    description,
    startDate,
    startTime,
    endDate,
    endTime,
    timeZone,
    calendarId,
  } = req.body;
  const clients = await calendarService.loadSavedCredentialsIfExist();
  if (!clients) {
    res.status(401).send("Authentication required");
    return;
  }
  const event = await calendarService.createEventCalendar(
    clients,
    summary,
    location,
    description,
    startDate,
    startTime,
    endDate,
    endTime,
    timeZone
  );
  console.log(event);
  res.status(201).json("Create Event successfully");
});

app.listen(8081, () => {
  console.log("server runing on port 8081");
});
