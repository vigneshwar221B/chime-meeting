const AWS = require("aws-sdk");

const chime = new AWS.Chime({ region: "us-east-1" });
chime.endpoint = new AWS.Endpoint("https://service.chime.aws.amazon.com");

const sts = new AWS.STS({ region: "us-east-1" });

const S3_ARN = process.env.S3_ARN;
console.log(`S3 destination for capture is ${S3_ARN || "not set."}`);

const chimeSDKMeetings = new AWS.ChimeSDKMeetings({ region: "us-east-1" });
const useChimeSDKMeetings = process.env.USE_CHIME_SDK_MEETINGS || "true";

const getClientForMeeting = (meeting) => {
  return useChimeSDKMeetings === "true" ||
    (meeting &&
      meeting.Meeting &&
      meeting.Meeting.MeetingFeatures &&
      meeting.Meeting.MeetingFeatures.Audio &&
      meeting.Meeting.MeetingFeatures.Audio.EchoReduction === "AVAILABLE")
    ? chimeSDKMeetings
    : chime;
};

const log = (message) => {
  console.log(`${new Date().toISOString()}: ${typeof message}`);
  console.log(message);
};

module.exports = { AWS, chime, sts, S3_ARN, getClientForMeeting, log };
