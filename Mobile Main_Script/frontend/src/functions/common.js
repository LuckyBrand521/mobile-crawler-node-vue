module.exports = {
    featureCheck(feature) {
    return feature === null ? '' : (feature == '1' ? 'Ja' : 'Nein');
    }
}