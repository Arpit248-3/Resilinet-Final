import React, { useState } from 'react';
import SuccessModal from './SuccessModal';

const RescueVerify = ({ victim, onComplete }) => {
    const [status, setStatus] = useState('idle');
    const [showSuccess, setShowSuccess] = useState(false);
    const [usedMethod, setUsedMethod] = useState('');

    const handleAidDistribution = async (method) => {
        // Logic Guard: Critical priority MUST use QR or BIO
        if (victim.priorityScore > 25 && method === 'BLE') {
            alert("SECURITY ALERT: Critical victims require higher authentication for expensive aid.");
            return;
        }

        setStatus('verifying');

        try {
            // Simulate API Call to backend distribute-aid
            const response = await fetch('http://localhost:5000/api/distribute-aid', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    victimId: victim._id, 
                    method: method,
                    authData: method === 'QR' ? "TOKEN_XYZ_123" : "BIO_HASH_998"
                })
            });

            if (response.ok) {
                setUsedMethod(method);
                setShowSuccess(true);
            }
        } catch (err) {
            alert("Verification Failed: Backend Unreachable");
            setStatus('idle');
        }
    };

    if (showSuccess) {
        return <SuccessModal 
                    method={usedMethod} 
                    victimId={victim.userId} 
                    onClose={onComplete} 
                />;
    }

    return (
        <div className="verify-container">
            <h3>Unit Verification: {victim.userId}</h3>
            <p>Priority Rank: <strong className="priority-high">{victim.priorityScore}</strong></p>
            
            <div style={{ display: 'grid', gap: '10px', marginTop: '20px' }}>
                <button 
                    onClick={() => handleAidDistribution('QR')} 
                    className="btn-verify"
                    disabled={status === 'verifying'}
                >
                    📱 QR HANDSHAKE
                </button>
                <button 
                    onClick={() => handleAidDistribution('BIOMETRIC')} 
                    className="btn-verify"
                    disabled={status === 'verifying'}
                >
                    ☝️ BIOMETRIC SCAN
                </button>
                <button 
                    onClick={() => handleAidDistribution('BLE')} 
                    className="btn-verify"
                    disabled={status === 'verifying'}
                >
                    📶 BLE AUTO-SYNC
                </button>
            </div>
            {status === 'verifying' && <p className="pulse-text">⏳ AUTHENTICATING...</p>}
        </div>
    );
};

export default RescueVerify;