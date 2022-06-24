const AWS = require("aws-sdk");
const db = new AWS.DynamoDB({ apiVersion: "2012-08-10" });
const dbClient = new AWS.DynamoDB.DocumentClient({ region: "us-east-1" });

const chime = new AWS.Chime({ region: "us-east-1" });
chime.endpoint = new AWS.Endpoint("https://service.chime.aws.amazon.com");

const sts = new AWS.STS({ region: "us-east-1" });

const S3_ARN = process.env.S3_ARN;
console.log(`S3 destination for capture is ${S3_ARN || "not set."}`);

const chimeSDKMeetings = new AWS.ChimeSDKMeetings({ region: "us-east-1" });
const useChimeSDKMeetings = process.env.USE_CHIME_SDK_MEETINGS || "true";
const JWT_SECRET = process.env.JWT_SECRET || 'ssshhh!';

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

//db functions
const getAll = async () => {
  const params = {
    TableName: "test-table",
  };

  const data = await dbClient.scan(params).promise();
  return data;
};

const getItem = async (Id) => {
  const params = {
    TableName: "test-table",
    Key: { Id },
  };

  const data = await dbClient.get(params).promise();
  return data;
};

const putItem = async (Id, putData) => {
  const params = {
    TableName: "test-table",
    Item: { Id, obj: putData },
  };

  const data = await dbClient.put(params).promise();
  return data;
};

const deleteItem = async (Id) => {
  const params = {
    TableName: "test-table",
    Key: { Id },
  };

  const data = await dbClient.delete(params).promise();
  return data;
};

const deleteAll = async () => {
  const records = await getAll();
  records.Items.forEach(async (item) => {
    await deleteItem(item.Id);
  });
  return "deleted all items";
};

module.exports = {
  AWS,
  chime,
  sts,
  S3_ARN,
  JWT_SECRET,
  getClientForMeeting,
  chimeSDKMeetings,
  log,
  getAll,
  getItem,
  putItem,
  deleteItem,
  deleteAll,
};
