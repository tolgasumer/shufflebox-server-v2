module.exports = (req, res) => {
  const businessController = require('./businessController.js')
  const businessid = req.body.businessid;

  async function sendPlaylist(businessid) {
    try {
      const spotifyApi = await businessController.spotifyApiFactory.createApi(businessid);
      const businessDoc = await businessController.db.collection('businesses').doc(businessid).get(); // get the spotify refresh token and playlist id of the business from firestore
      const businessPlaylistTracks = await spotifyApi.getPlaylistTracks(businessDoc.data().spotify_playlistid); // pull tracks of the business' playlist from spotify api
      res.status(200).json(businessPlaylistTracks);
    } catch (error) {
      console.log(error);
      res.status(500).send(error);
    }
  }

  sendPlaylist(businessid); // response of GET on this endpoint
  

};