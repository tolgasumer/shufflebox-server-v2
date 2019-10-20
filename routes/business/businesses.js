module.exports = (req, res) => {
    const businessController = require('./businessController.js');

    let responseJson = [];
    let businessesRef = businessController.db.collection('businesses');
    let allBusinesses = businessesRef.get() // get all businesses
        .then(snapshot => {
            snapshot.forEach(doc => {
                // push all found business id's and names to the response
                responseJson.push({
                    'id': doc.id,
                    'name': doc.data().name,
                });
            });
        })
        .catch(err => {
            console.log('Error getting documents', err);
        });
    allBusinesses.then(() => res.json(responseJson));
};