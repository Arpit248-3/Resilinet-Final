// backend/utils/priorityEngine.js
const calculatePriority = (alert, clusterCount) => {
    const severityMap = { 'Critical': 3, 'Moderate': 2, 'Minor': 1 };
    const S = severityMap[alert.severity] || 1;

    // Time Escalation: Increases by 0.5 every 30 mins (max 5)
    const minutesWaiting = (Date.now() - new Date(alert.timestamp).getTime()) / (1000 * 60);
    const T = Math.min((minutesWaiting / 30) * 0.5, 5);

    // Cluster Risk Factor (from geospatial data)
    const C = Math.min(clusterCount, 10);

    // Reliability Penalty (if not mesh-verified)
    const R = alert.isMeshVerified ? 0 : 1;

    const score = (S * 5) + (T * 3) + (C * 4) - (R * 2);
    return parseFloat(score.toFixed(2));
};

module.exports = { calculatePriority };