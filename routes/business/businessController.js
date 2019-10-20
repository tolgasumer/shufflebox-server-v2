const router = require('express').Router();
const businesses = require('./businesses');
const playlist = require('./playlist');
const votingsession = require('./votingsession');
const vote = require('./vote');
require('dotenv').config(); // fetch dotenv values
// init spotify api
const SpotifyWebApi = require('spotify-web-api-node');

// factory to create spotify api handlers for each businesss
const spotifyApiFactory = {
    async createApi(businessid) {
        let businessDoc = await db.collection('businesses').doc(businessid).get(); // get the spotify refresh token and playlist id of the business from firestore
        let spotifyApi = new SpotifyWebApi({
            clientId: process.env.SPOTIFY_CLIENTID,
            clientSecret: process.env.SPOTIFY_SECRET,
            refreshToken: businessDoc.data().spotify_refreshtoken,
        });
        await spotifyApi.refreshAccessToken().then(
            function (data) {
                console.log('The access token has been refreshed!');
                // Save the access token so that it's used in future calls
                spotifyApi.setAccessToken(data.body['access_token']);
            },
            function (err) {
                console.log('Could not refresh access token', err);
            }
        );
        return spotifyApi;
    }
}

// init firebase
const firebase = require("firebase");
firebase.initializeApp({
    apiKey: process.env.FIREBASE_APIKEY,
    authDomain: process.env.FIREBASE_AUTHDOMAIN,
    databaseURL: process.env.FIREBASE_DATABASEURL,
    projectId: process.env.FIREBASE_PROJECTID,
    storageBucket: process.env.FIREBASE_STORAGEBUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGESENDERID,
    appId: process.env.FIREBASE_APPID
});
const db = firebase.firestore();

// init redis
const Redis = require("ioredis");
const redisClient = new Redis("redis://cache");
const JSONCache = require('redis-json');
const redisJson = new JSONCache(redisClient, {
    prefix: 'votingsession:'
});
redisClient.on('connect', function () {
    console.log('Redis client connected');
});

// connect routes
router.get('/businesses', businesses);
router.get('/playlist', playlist);
router.get('/votingsession', votingsession);
router.post('/vote', vote);

module.exports = {
    spotifyApiFactory,
    db,
    redisClient,
    redisJson,
    router
}