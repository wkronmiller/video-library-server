'use strict';

const ytdl = require('ytdl-core');
const { tableName, dynamodb, listVideos, getVideo, extractDynamoProps, } = require('./videos');

function getVideoInfo(videoId) {
  return ytdl.getInfo(`https://www.youtube.com/watch?v=${videoId}`)
    .then(({ title, description, thumbnail_url: thumbnailUrl }) =>
      ({ title, description, thumbnailUrl, }));
}

const VIDEO_FORMAT = 'mp4';
function getVideoUrl(videoId) {
  return ytdl.getInfo(`https://www.youtube.com/watch?v=${videoId}`)
    .then(info => {
      const { formats } = info;
      const [{ url: videoUrl }] = formats.filter(({ container }) => container === VIDEO_FORMAT).slice(0,1);
      return videoUrl;
    });
}

function addVideo(videoId) {
  console.log('Adding video', videoId);
  return getVideoInfo(videoId)
    .then(({ title, description, thumbnailUrl }) => ({
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
        category: {
          S: 'youtube',
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
    .then(extractDynamoProps)
    .then(video => getVideoUrl(video.videoId).then(videoUrl => Object.assign(video, { videoUrl })))
    .then(video => callback(null, {
      statusCode: 200,
      body: JSON.stringify({ video })
    }))
    .catch(err => callback(null, {
      statusCode: 500,
      body: JSON.stringify({ err }),
    }));
};
