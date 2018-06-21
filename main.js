const { listVideos, extractDynamoProps, } = require('./videos');

const apiGatewayEnv = 'dev';

module.exports.list = (event, context, callback) => {
  listVideos()
    .then(({ Items }) => Items)
    .then(items => items.map(extractDynamoProps))
    .then(items => items.map(({ videoId, title, thumbnailUrl, category }) =>
      ({ videoId, category, title, thumbnailUrl, infoUrl: `/${apiGatewayEnv}/${category}/videos/video/${videoId}` })))
    .then(videos => videos.reduce((obj, video) => {
      const { category } = video;
      delete video.category;
      return Object.assign(obj, { [category]: (obj[category] || []).concat(video) })
    }, {}))
    .then(videos => callback(null, {
      statusCode: 200,
      body: JSON.stringify({ videos })
    }))
    .catch(err => callback(null, {
      statusCode: 500,
      body: JSON.stringify({ err }),
    }));
};

