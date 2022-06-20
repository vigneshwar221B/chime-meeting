const express = require("express");
const { v4: uuid } = require("uuid");

const dotenv = require("dotenv");
dotenv.config();

const { chime, getClientForMeeting, log, S3_ARN } = require("./helper");

const app = express();
app.use(express.static(__dirname + "/static"));

const meetingTable = {};

//for development purposes
app.get("/get-all-meetings", (req, res) => {
  log(meetingTable);
  res.json(meetingTable);
});

//end points
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

app.post("/end", async (req, res) => {
  let client = getClientForMeeting(meetingTable[req.query.title]);

  await client
    .deleteMeeting({
      MeetingId: meetingTable[req.query.title].Meeting.MeetingId,
    })
    .promise();
  res.send(`meeting ${req.query.title} has been ended`);
});

app.post("/remove-attendee", async (req, res) => {
  if (!req.query.title || !req.query.attendeeId) {
    res.status(400).send("need params: title and attendeeId");
  }
  let client = getClientForMeeting(meetingTable[req.query.title]);
  const meeting = meetingTable[req.query.title];

  await client
    .deleteAttendee({
      MeetingId: meeting.Meeting.MeetingId,
      AttendeeId: req.query.attendeeId,
    })
    .promise();

  res.send(`Attendee ${req.query.attendeeId} has been removed`);
});

app.post("/start-capture", async (req, res) => {
  if (!S3_ARN) {
    res.status(400).send("media capture is not available without a S3.");
  }
  const callerInfo = await sts.getCallerIdentity().promise();
  const pipelineInfo = await chime
    .createMediaCapturePipeline({
      SourceType: "ChimeSdkMeeting",
      SourceArn: `arn:aws:chime::${callerInfo.Account}:meeting:${
        meetingTable[req.query.title].Meeting.MeetingId
      }`,
      SinkType: "S3Bucket",
      SinkArn: S3_ARN,
    })
    .promise();
  meetingTable[req.query.title].Capture = pipelineInfo.MediaCapturePipeline;
  res.send("media capture is active now");
});

app.post("/end-capture", async (req, res) => {
  if (!S3_ARN) {
    res.status(400).send("media capture is not available without a S3.");
  }
  const pipelineInfo = meetingTable[req.query.title].Capture;
  await chime
    .deleteMediaCapturePipeline({
      MediaPipelineId: pipelineInfo.MediaPipelineId,
    })
    .promise();
  meetingTable[req.query.title].Capture = undefined;
  res.send("media capture has been stopped");
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`http://localhost:${port}`));
