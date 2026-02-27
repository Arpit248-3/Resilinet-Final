// src/constants.js
// Replace with the IP address printed in your node server.js terminal
const SERVER_IP = "172.16.14.31"; 

export const API_ALERTS = `http://${SERVER_IP}:5000/api/alerts`;
export const API_CLEAR = `http://${SERVER_IP}:5000/api/clear-alerts`;