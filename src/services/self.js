const { SelfBackendVerifier, AllIds, DefaultConfigStore } = require('@selfxyz/core');

const configStore = new DefaultConfigStore({
  excludedCountries: [],
  ofac: false,
  gender: true
});

const selfBackendVerifier = new SelfBackendVerifier(
  'gender-verification',
  process.env.SERVER_URL + '/api/users/verify-gender',
  false,
  AllIds,
  configStore,
  'uuid'
);

const verifyProof = async (attestationId, proof, publicSignals, userContextData) => {
  const result = await selfBackendVerifier.verify(attestationId, proof, publicSignals, userContextData)
  return {
    isValid: result.isValidDetails.isValid,
    credentialSubject: result.discloseOutput,
    userData: result.userData,
    isValidDetails: result.isValidDetails
  }
}

module.exports = { verifyProof }


