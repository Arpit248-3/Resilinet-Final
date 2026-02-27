import React, { useState } from 'react';

const RescueVerify = ({ victim, onComplete }) => {
    const [status, setStatus] = useState('idle');

    const handleAidDistribution = async (method) => {
        setStatus('verifying');
        
        // Logical check: Is this a critical cluster needing visual triage?
        const needsActiveVerification = victim.priorityScore > 25;

        if (needsActiveVerification) {
            if (method === 'BLE') {
                alert("🚨 Critical Priority! Please use QR Handshake or Biometric Scan for expensive supplies.");
                setStatus('idle');
                return;
            }
        } else {
            // Non-critical: Force BLE for efficiency
            method = 'BLE';
        }

        // Simulate Hardware/API Call
        setTimeout(async () => {
            console.log(`Verified via ${method}`);
            // In real app, call fetch('/api/distribute-aid') here
            setStatus('success');
            setTimeout(onComplete, 1000);
        }, 1500);
    };

    return (
        <div style={{ padding: '20px', background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <h3>Unit Verification: {victim.userId}</h3>
            <p>Priority Rank: <strong>{victim.priorityScore}</strong></p>
            
            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                <button onClick={() => handleAidDistribution('QR')} disabled={status === 'verifying'}>
                    📱 QR Handshake
                </button>
                <button onClick={() => handleAidDistribution('BIO')} disabled={status === 'verifying'}>
                    ☝️ Biometric
                </button>
                <button onClick={() => handleAidDistribution('BLE')} disabled={status === 'verifying'}>
                    📶 BLE Sync
                </button>
            </div>
            {status === 'verifying' && <p style={{color: 'var(--neon-blue)'}}>⏳ Authenticating...</p>}
        </div>
    );
};

export default RescueVerify;