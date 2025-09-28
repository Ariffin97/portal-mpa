import React, { useState } from 'react';

const AssessmentRecovery = () => {
  const [backupData, setBackupData] = useState('');
  const [recoveryResult, setRecoveryResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const findLocalBackups = () => {
    const backups = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('assessment_backup_')) {
        try {
          const data = JSON.parse(localStorage.getItem(key));
          backups.push({
            key,
            data,
            timestamp: new Date(data.submissionTime).toLocaleString(),
            participant: data.userInfo?.name || 'Unknown'
          });
        } catch (error) {
          console.warn('Invalid backup data found:', key);
        }
      }
    }
    return backups;
  };

  const exportBackups = () => {
    const backups = findLocalBackups();
    const exportData = backups.map(backup => backup.data);

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `assessment_backups_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleRecovery = async () => {
    if (!backupData.trim()) {
      alert('Please paste the backup data first');
      return;
    }

    setIsLoading(true);
    try {
      const parsedData = JSON.parse(backupData);
      const dataArray = Array.isArray(parsedData) ? parsedData : [parsedData];

      const response = await fetch('/api/assessment/recover', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          backupData: dataArray,
          adminNote: 'Manual recovery from localStorage backup'
        })
      });

      const result = await response.json();
      setRecoveryResult(result);
    } catch (error) {
      setRecoveryResult({
        success: false,
        message: 'Failed to parse or submit backup data: ' + error.message
      });
    }
    setIsLoading(false);
  };

  const localBackups = findLocalBackups();

  return (
    <div style={{
      maxWidth: '800px',
      margin: '20px auto',
      padding: '20px',
      backgroundColor: '#f8f9fa',
      borderRadius: '8px',
      border: '1px solid #dee2e6'
    }}>
      <h2 style={{ color: '#495057', marginBottom: '20px' }}>
        Assessment Data Recovery Tool
      </h2>

      <div style={{ marginBottom: '30px' }}>
        <h3 style={{ color: '#495057' }}>📱 Local Backups Found</h3>
        {localBackups.length > 0 ? (
          <>
            <p style={{ color: '#6c757d' }}>
              Found {localBackups.length} backup(s) in your browser's local storage:
            </p>
            <div style={{ marginBottom: '15px' }}>
              {localBackups.map((backup, index) => (
                <div key={backup.key} style={{
                  padding: '10px',
                  backgroundColor: '#e8f5e8',
                  border: '1px solid #4caf50',
                  borderRadius: '4px',
                  marginBottom: '8px'
                }}>
                  <strong>{backup.participant}</strong> - {backup.timestamp}
                  <br />
                  <small>Form: {backup.data.assessmentFormData?.code}</small>
                </div>
              ))}
            </div>
            <button
              onClick={exportBackups}
              style={{
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '4px',
                cursor: 'pointer',
                marginRight: '10px'
              }}
            >
              📥 Export All Backups
            </button>
            <button
              onClick={() => setBackupData(JSON.stringify(localBackups.map(b => b.data), null, 2))}
              style={{
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              📋 Load for Recovery
            </button>
          </>
        ) : (
          <p style={{ color: '#856404', backgroundColor: '#fff3cd', padding: '10px', borderRadius: '4px' }}>
            ⚠️ No local backups found in this browser.
          </p>
        )}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ color: '#495057' }}>🔄 Manual Recovery</h3>
        <p style={{ color: '#6c757d' }}>
          If you have backup data (JSON format), paste it below to recover lost submissions:
        </p>
        <textarea
          value={backupData}
          onChange={(e) => setBackupData(e.target.value)}
          placeholder="Paste your assessment backup data here..."
          style={{
            width: '100%',
            height: '200px',
            padding: '10px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            fontFamily: 'monospace',
            fontSize: '12px'
          }}
        />
      </div>

      <button
        onClick={handleRecovery}
        disabled={isLoading || !backupData.trim()}
        style={{
          backgroundColor: isLoading ? '#6c757d' : '#dc3545',
          color: 'white',
          border: 'none',
          padding: '12px 24px',
          borderRadius: '4px',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          fontSize: '16px',
          fontWeight: 'bold'
        }}
      >
        {isLoading ? '🔄 Processing...' : '🚑 Recover Data'}
      </button>

      {recoveryResult && (
        <div style={{
          marginTop: '20px',
          padding: '15px',
          borderRadius: '4px',
          backgroundColor: recoveryResult.success ? '#d4edda' : '#f8d7da',
          border: `1px solid ${recoveryResult.success ? '#c3e6cb' : '#f5c6cb'}`,
          color: recoveryResult.success ? '#155724' : '#721c24'
        }}>
          <h4>{recoveryResult.success ? '✅ Recovery Success' : '❌ Recovery Failed'}</h4>
          <p>{recoveryResult.message}</p>
          {recoveryResult.data && (
            <div>
              <p>Recovered: {recoveryResult.data.recovered} submissions</p>
              <p>Errors: {recoveryResult.data.errors}</p>
              {recoveryResult.data.errorDetails && recoveryResult.data.errorDetails.length > 0 && (
                <details>
                  <summary>Error Details</summary>
                  <ul>
                    {recoveryResult.data.errorDetails.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          )}
        </div>
      )}

      <div style={{
        marginTop: '30px',
        padding: '15px',
        backgroundColor: '#e3f2fd',
        border: '1px solid #bbdefb',
        borderRadius: '4px'
      }}>
        <h4 style={{ color: '#1565c0' }}>💡 How Recovery Works</h4>
        <ul style={{ color: '#1565c0', marginBottom: '0' }}>
          <li>Assessment data is automatically backed up to your browser's local storage when you complete assessments</li>
          <li>If submissions were lost due to expired codes, you can recover them using this tool</li>
          <li>Export your backups regularly to prevent data loss</li>
          <li>Contact administrators if you need help with the recovery process</li>
        </ul>
      </div>
    </div>
  );
};

export default AssessmentRecovery;