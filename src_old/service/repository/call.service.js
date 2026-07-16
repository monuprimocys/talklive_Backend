const db = require("../../../models");
const { Call } = db;
const { v4: uuidv4 } = require('uuid');
async function makeCall(callPayload) {
    try {
        const call = await Call.create(callPayload);
        return call;
    } catch (error) {
        console.error("Error in making call", error);
        throw error;
    }
}

async function updateCallStatus(call_id, payload) {
    try {
        const call = await Call.update(payload, { where: { call_id: call_id }, returning: true });
        return call;    
    } catch (error) {
        console.error("Error in accepting call", error);
        throw error;
    }
}

async function getCall(payload, include = []) {
    try {
        const call = await Call.findOne({ where: payload, include });
        return call;
    } catch (error) {
        console.error("Error in getting call", error);
        throw error;
    }
}



/**
 * Generate a unique room ID
 * @returns {string} - Unique room ID
 */
const generateRoomId = () => {
    const roomId = uuidv4().replace(/-/g, ''); // Remove dashes for a cleaner ID
    return roomId;
};


module.exports = {
  makeCall,
  updateCallStatus,
  getCall,
  generateRoomId,
};