module.exports = (req, res) => {
  const businessController = require('./businessController.js')
  const _utils = require('./_utils.js');
  let businessid = req.body.businessid;

  async function playWinner(businessid) {
    console.log("Playing the most voted track on the last session for businessid:", businessid);
    let businessVotingSession = await businessController.redisJson.get(businessid); // get voting session from cache
    let businessDoc = await businessController.db.collection('businesses').doc(businessid).get(); // get the spotify playlist id of the business from firestore
    let totalVoteCount = 0;
    for (let i = 0; i < businessVotingSession.votables.length; i++) { // count the total count of votes
      totalVoteCount += businessVotingSession.votables[i].voteCount;
    };
    if (totalVoteCount > 0) { // play the most voted track if there are any votes recorded
      let sortedVotables = businessVotingSession.votables.sort(_utils.sort_by('voteCount', true, parseInt)); // sort by voteCount high to low
      try { // play the most voted track
        let spotifyApi = await businessController.spotifyApiFactory.createApi(businessid);
        await spotifyApi.play({
          "context_uri": "spotify:playlist:" + businessDoc.data().spotify_playlistid,
          "offset": {
            "uri": "spotify:track:" + sortedVotables[0].id
          }
        });
      } catch (error) {
        console.log(error);
      }
    }

    startVotingSession(businessid); // start a new voting session after the track starts to play

  };

  async function startVotingSession(businessid) {
    console.log("Starting voting session for businessid:", businessid);
    let spotifyApi = await businessController.spotifyApiFactory.createApi(businessid);
    let businessDoc = await businessController.db.collection('businesses').doc(businessid).get(); // get the spotify refresh token and playlist id of the business from firestore
    let businessPlaylistTracks = await spotifyApi.getPlaylistTracks(businessDoc.data().spotify_playlistid); // pull tracks of the business' playlist from spotify api
    let businessVotables = [];
    for (let i = 0; i < 5; i++) { // get 5 random track objects from the playlist
      businessVotables.push(businessPlaylistTracks.body.items[Math.floor(Math.random() * businessPlaylistTracks.body.items.length)].track);
      businessVotables[i].voteCount = 0; // assign voteCount to every votable track
    };
    let businessVotingSession = [];
    businessVotingSession.votables = businessVotables;

    let currentlyPlayingTrack = await spotifyApi.getMyCurrentPlayingTrack(); // pull the information about the currently playing track
    let sessionTimeLeft_ms = currentlyPlayingTrack.body.item.duration_ms - currentlyPlayingTrack.body.progress_ms; // determine duration of the session
    let sessionTimeLeft = Math.round(sessionTimeLeft_ms / 1000); // turn milliseconds to seconds, to use it on redis ttl later

    await businessController.redisJson.set(businessid, businessVotingSession, options = {
      expire: sessionTimeLeft
    }); // cache the VotingSession to 'businessid' index in redis, will expire when the current track ends
    setTimeout(playWinner, sessionTimeLeft_ms - 2000, businessid); // trigger the timeout to play the winning track after the voting session ends
    console.log("Started voting session for businessid:", businessid, "with duration:", sessionTimeLeft, "seconds");

  };

  async function sendVotingSession(businessid) {
    try {
      let businessVotingSession = await businessController.redisJson.get(businessid); // get voting session from cache
      if (!businessVotingSession) { // create voting session if one doesn't exist for the business
        console.log("Voting session doesn't exist for businessid:", businessid, ".Starting new voting session...");
        await startVotingSession(businessid);
        businessVotingSession = await businessController.redisJson.get(businessid); // fetch the created voting session from cache
      }
      let sessionTimeLeft = await businessController.redisClient.ttl('votingsession:' + businessid);
      businessVotingSession.sessionTimeLeft = sessionTimeLeft;
      res.status(200).json(businessVotingSession);
    } catch (error) {
      console.log(error);
    }
  }
  
  sendVotingSession(businessid); // response of GET on this endpoint
};