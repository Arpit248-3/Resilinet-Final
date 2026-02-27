import React from 'react';

const SuccessModal = ({ method, victimId, onClose }) => {
    return (
        <div className="verify-modal-overlay">
            <div className="success-modal-content" style={{
                background: '#0a0a0a',
                padding: '40px',
                borderRadius: '15px',
                border: '2px solid #4dff88',
                textAlign: 'center',
                boxShadow: '0 0 30px rgba(77, 255, 136, 0.2)',
                maxWidth: '400px'
            }}>
                <div style={{ fontSize: '60px', marginBottom: '20px' }}>✅</div>
                <h2 style={{ color: '#4dff88', marginBottom: '10px' }}>AID AUTHORIZED</h2>
                <p style={{ color: '#ccc', marginBottom: '20px' }}>
                    Verification via <strong>{method}</strong> successful for ID: <br/>
                    <code style={{ background: '#222', padding: '2px 5px' }}>{victimId}</code>
                </p>
                
                <div style={{ 
                    textAlign: 'left', 
                    background: '#1a1a1a', 
                    padding: '15px', 
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    marginBottom: '20px'
                }}>
                    <div style={{ color: '#4dff88' }}>&gt; Handshake_Verified: TRUE</div>
                    <div style={{ color: '#4dff88' }}>&gt; Supply_Ledger_Updated: OK</div>
                    <div style={{ color: '#4dff88' }}>&gt; Mesh_Sync_Broadcast: COMPLETED</div>
                </div>

                <button 
                    onClick={onClose}
                    style={{
                        background: '#4dff88',
                        color: '#000',
                        border: 'none',
                        padding: '10px 30px',
                        borderRadius: '5px',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                    }}
                >
                    CLOSE COMMAND
                </button>
            </div>
        </div>
    );
};

export default SuccessModal;