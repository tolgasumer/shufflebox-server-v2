module.exports = (req, res) => {
  const businessController = require('./businessController.js');

  // TODO: check userid
  const businessid = req.body.businessid;
  const trackid = req.body.trackid;

  async function incrementVoteForTrack(businessid, trackid) {
    console.log("Incrementing voteCount for songid:", trackid);
    let businessVotingSession = await businessController.redisJson.get(businessid); // get voting session from cache
    for (let i = 0; i < businessVotingSession.votables.length; i++) { // find the track and increment its voteCount
      if (businessVotingSession.votables[i].id == trackid) {
        businessVotingSession.votables[i].voteCount++;
      };
    };
    await businessController.redisJson.set(businessid, businessVotingSession); // rewrite the voting session to cache
    res.status(200).send();
  };
  /*try {
    businessController.spotifyApi.play({
      "context_uri": "spotify:playlist:7zlrsbOPUdw3MgtQhaRPV0",
      "offset": {
        "uri": "spotify:track:34x6hEJgGAOQvmlMql5Ige"
      }
    })
      .then(result => res.status(200).json(result));
  } catch (error) {
    res.status(400).send(error);
  }*/
  /*businessController.redisClient.hgetall("hosts", function (err, obj) {
    console.dir(obj['mjr']);
  });*/
  /*async function receiveVote(businessid, trackid) {
    try {
      incrementVoteForTrack(businessid, trackid);
    } catch (error) {
      console.log(error);
    }
  }*/
  //receiveVote(businessid, trackid);
  incrementVoteForTrack(businessid, trackid);
  //startVotingSession(businessid);
  //setTimeout(incrementVoteForTrack, 5000, businessid, trackid);
};