# About

Serverless node API for yt-red/plex style video apps that imma make.

# API Design

WIP


GET /videos
{
  “videos”: { 
     “youtube”: [{ “videoId”: “foo”,  “title”: “bar”, “thumbnailUrl”: “https://…”, “infoUrl”: “/foo” }] 
  }
}

POST /[provider]/videos

GET /[provider]/videos/[videoId]
{ “id”: “foo”, “downloadUrl”: “https://…”}
