// src/constants.js
const SERVER_IP = "172.16.14.31"; 

export const API_ALERTS = `http://${SERVER_IP}:5000/api/alerts`;
export const API_TRIAGE = `http://${SERVER_IP}:5000/api/trigger-cluster-escalation`;
export const API_DISTRIBUTE = `http://${SERVER_IP}:5000/api/distribute-aid`;