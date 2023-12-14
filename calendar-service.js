const fs = require("fs").promises;

const { google } = require("googleapis");
const path = require("path");

const CREDENTIALS_PATH = path.join(process.cwd(), "credentials.json");
const TOKEN_PATH = path.join(process.cwd(), "token.json");

exports.loadSavedCredentialsIfExist = async function () {
  try {
    const content = await fs.readFile(TOKEN_PATH);
    console.log(content, "content");
    const credentials = JSON.parse(content);
    console.log(credentials, "credentials");
    return google.auth.fromJSON(credentials);
  } catch (err) {
    return null;
  }
};

exports.saveCredentials = async function (client) {
  const content = await fs.readFile(CREDENTIALS_PATH);
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;
  const payload = JSON.stringify({
    type: "authorized_user",
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });
  await fs.writeFile(TOKEN_PATH, payload);
};

exports.listEvents = async function (auth) {
  const calendar = google.calendar({ version: "v3", auth });
  const res = await calendar.events.list({
    calendarId: "primary",
    timeMin: new Date().toISOString(),
    maxResults: 10,
    singleEvents: true,
    orderBy: "startTime",
  });

  // console.log("Upcoming 10 events:");

  const events = res.data.items;
  if (!events || events.length === 0) {
    console.log("No upcoming events found.");
    return;
  }
  events.map((event, i) => {
    const start = event.start.dateTime || event.start.date;
    console.log(`${start} - ${event.summary}`);
    console.log(event);
  });
};

exports.createEventCalendar = async (
  auth,
  summary,
  location,
  description,
  startDate,
  startTime,
  endDate,
  endTime,
  timeZone,
  calendarId
) => {
  const calendar = google.calendar({ version: "v3", auth });
  const event = {
    summary,
    location,
    description,
    start: {
      dateTime: `${startDate}T${startTime}`,
      timeZone,
    },
    end: {
      dateTime: `${endDate}T${endTime}`,
      timeZone,
    },
  };
  calendar.events.insert(
    {
      calendarId: calendarId || "primary",
      resource: event,
    },
    (err, res) => {
      if (err) {
        console.error("Error creating event:", err);
        return;
      }
      console.log("Event created:", res.data);
    }
  );
  console.log("event added");
};
