'use strict';

const ytdl = require('ytdl-core');
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

function getVideoInfo(videoId) {
  return ytdl.getInfo(`https://www.youtube.com/watch?v=${videoId}`)
    .then(({ title, description, thumbnail_url: thumbnailUrl, video_url: videoUrl }) =>
      ({ title, description, thumbnailUrl, videoUrl }));
}

function addVideo(videoId) {
  console.log('Adding video', videoId);
  return getVideoInfo(videoId)
    .then(({ title, description, thumbnailUrl, videoUrl }) => ({
      Item: {
        videoId: {
          S: videoId
        },
        title: {
          S: title
        },
        description: {
          S: description
        },
        thumbnailUrl: {
          S: thumbnailUrl
        },
        videoUrl: {
          S: videoUrl
        },
      },
      TableName: tableName
    }))
    .then(params => 
      new Promise((resolve, reject) => 
        dynamodb.putItem(params, (err, data) => (err) ? reject(err) : resolve(data))));
};

module.exports.add = ({ body }, context, callback) => {
  const { videoId } = JSON.parse(body);
  addVideo(videoId)
    .then(() => callback(null, { statusCode: 200, body: '{}' }))
    .catch(err => callback(null, { statusCode: 500, body: JSON.stringify({ err }) }));
};

module.exports.remove = (event, context, callback) => {
  callback(null, {
    statusCode: 200,
    body: JSON.stringify({ event })
  });
};

module.exports.list = (event, context, callback) => {
  listVideos()
    .then(({ Items }) => Items)
    .then(items => items.map(({ videoId: { S } }) => S))
    .then(videos => callback(null, {
      statusCode: 200,
      body: JSON.stringify({ videos })
    }))
    .catch(err => callback(null, {
      statusCode: 500,
      body: JSON.stringify({ err }),
    }));
};
