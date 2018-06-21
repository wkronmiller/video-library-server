const AWS = require('aws-sdk');

AWS.config.update({ region: 'us-east-1' });

const tableName = 'videosTable';
const dynamodb = new AWS.DynamoDB();

function listVideos() {
  const params = {
    TableName: tableName
  };
  return new Promise(resolve => dynamodb.scan(params, (err, data) => {
    if(err) { throw err; }
    resolve(data);
  }));
}

function getVideo(videoId) {
  const params = {
    Key: {
      videoId: {
        S: videoId
      }
    },
    TableName: tableName,
  };
  return new Promise((resolve, reject) =>
    dynamodb.getItem(params, (err, data) => 
      (err) ? reject(err) : resolve(data)));
}

function extractDynamoProps(doc) {
    return Object.keys(doc)
      .map(key => ({ [key]: doc[key][Object.keys(doc[key])[0]] }))
      .reduce((a,b) => Object.assign(a,b), {});
}

module.exports = {
  tableName, dynamodb, listVideos, getVideo, extractDynamoProps,
};
