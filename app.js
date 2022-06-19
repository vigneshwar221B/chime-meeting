const AWS = require("aws-sdk");
const express = require("express");
const { v4: uuid } = require("uuid");

const app = express();

const dotenv = require("dotenv");
dotenv.config();

const port = process.env.PORT || 3000;

app.use(express.static(__dirname + "/static"));
const meetingTable = {};

const chime = new AWS.Chime({ region: "us-east-1" });
chime.endpoint = new AWS.Endpoint("https://service.chime.aws.amazon.com");

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

app.get("/create-meeting", async (req, res) => {
  const meetingResponse = await chime
    .createMeeting({
      ClientRequestToken: uuid(),
      MediaRegion: "us-west-2", // Specify the region in which to create the meeting.
    })
    .promise();

  const attendeeResponse = await chime
    .createAttendee({
      MeetingId: meetingResponse.Meeting.MeetingId,
      ExternalUserId: uuid(), // Link the attendee to an identity managed by your application.
    })
    .promise();
    
  res.send({ meetingResponse, attendeeResponse });
});

app.listen(port, () => {
  console.log(`App is listening on port http://localhost:${port}`);
});
