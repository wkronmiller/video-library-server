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

const VIDEO_FORMAT = 'mp4';
function getVideoInfo(videoId) {
  return ytdl.getInfo(`https://www.youtube.com/watch?v=${videoId}`)
    .then(info => {
      const { formats } = info;
      const [{ url: videoUrl }] = formats.filter(({ container }) => container === VIDEO_FORMAT).slice(0,1);
      return Object.assign(info, { videoUrl });
    })
    .then(({ title, description, thumbnail_url: thumbnailUrl, videoUrl }) =>
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
        format: {
          S: VIDEO_FORMAT,
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

module.exports.get = ({ pathParameters: { id } }, context, callback) => {
  getVideo(id)
    .then(({ Item }) => Item)
    .then(item => Object.keys(item)
      .map(key => ({ [key]: item[key][Object.keys(item[key])[0]] }))
      .reduce((a,b) => Object.assign(a,b), {}))
    .then(video => callback(null, {
      statusCode: 200,
      body: JSON.stringify({ video })
    }))
    .catch(err => callback(null, {
      statusCode: 500,
      body: JSON.stringify({ err }),
    }));
};

module.exports.list = (event, context, callback) => {
  listVideos()
    .then(({ Items }) => Items)
    .then(items => items.map(({ videoId: { S: videoId }, thumbnailUrl: { S: thumbnailUrl } }) => ({ videoId, thumbnailUrl })))
    .then(videos => callback(null, {
      statusCode: 200,
      body: JSON.stringify({ videos })
    }))
    .catch(err => callback(null, {
      statusCode: 500,
      body: JSON.stringify({ err }),
    }));
};

//TODO: generic video library with URL and thumbnail info, metadata upon request
