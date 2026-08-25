/**
 * Generates a random alphanumeric Room ID prefix with 'CR-'
 * Example: CR-7K9P2X
 */
function generateRoomId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `CR-${result}`;
}

module.exports = generateRoomId;
