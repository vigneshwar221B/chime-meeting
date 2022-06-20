const express = require("express");
const { v4: uuid } = require("uuid");

const dotenv = require("dotenv");
dotenv.config();

const { chime, getClientForMeeting, log } = require("./helper");

const app = express();
app.use(express.static(__dirname + "/static"));

const meetingTable = {};

//for development purposes
app.get("/get-all-meetings", (req, res) => {
  log(meetingTable);
  res.json(meetingTable);
});

app.post("/join", async (req, res) => {
  log(req.query);

  if (!req.query.title || !req.query.name || !req.query.region) {
    res.status(400).send("need query params: title, name, and region");
  }

  const meetingIdFormat =
    /^[a-fA-F0-9]{8}(?:-[a-fA-F0-9]{4}){3}-[a-fA-F0-9]{12}$/;
  let meeting = meetingTable[req.query.title];

  let client = getClientForMeeting(meeting);

  if (!meeting) {
    let request = {
      ClientRequestToken: uuid(),
      MediaRegion: req.query.region,
      ExternalMeetingId: req.query.title.substring(0, 64),
    };
    console.info("Creating new meeting: " + JSON.stringify(request));
    meeting = await client.createMeeting(request).promise();
    meetingTable[req.query.title] = meeting;
  }

  const attendee = await client
    .createAttendee({
      MeetingId: meeting.Meeting.MeetingId,
      ExternalUserId: `${uuid().substring(0, 8)}#${req.query.name}`.substring(
        0,
        64
      ),
    })
    .promise();

  let response = {
    JoinInfo: {
      Meeting: meeting,
      Attendee: attendee,
    },
  };

  res.json(response);
});


const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`http://localhost:${port}`));
