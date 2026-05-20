/**
 * Handles broadcasting call-related changes (mute/unmute, video on/off, etc.)
 * to all participants in a given call room.
 *
 * @param {object} socket - The connected socket instance of the user making the change.
 * @param {object} data - Data containing call change info (e.g., mute/unmute, video toggle, etc.).
 * @param {function} emitEvent - Function to send an event to a specific socket(s).
 * @param {function} emitToRoom - Function to broadcast an event to all sockets in a room.
 */
async function call_Changes(socket, data, emitEvent, emitToRoom) {
  try {
    // ✅ Broadcast the call changes event to everyone in the same room
    emitToRoom(data.room_id, "call_changes", data);
  } catch (error) {
    console.error("Error in call changes", error);

    // ❌ If something goes wrong, notify only the requesting socket
    return emitEvent([socket.id], "call", {
      success: false,
      error: error.message,
    });
  }
}

module.exports = {
  call_Changes,
};
