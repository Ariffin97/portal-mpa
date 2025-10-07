import React, { useState, useEffect } from 'react';
import apiService from '../services/api';

// Add CSS animations
const styles = `
  @keyframes pulse {
    0% {
      transform: scale(1);
      box-shadow: 0 0 0 0 rgba(255, 71, 87, 0.7);
    }
    70% {
      transform: scale(1.1);
      box-shadow: 0 0 0 6px rgba(255, 71, 87, 0);
    }
    100% {
      transform: scale(1);
      box-shadow: 0 0 0 0 rgba(255, 71, 87, 0);
    }
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = styles;
  document.head.appendChild(styleElement);
}

const OrganiserInbox = ({ organizationData, isOpen, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [error, setError] = useState('');

  // Load messages when inbox is opened
  useEffect(() => {
    if (isOpen && organizationData?.email) {
      setLoading(true);
      loadMessages();
    }
  }, [isOpen, organizationData]);

  // Load unread count periodically for notification
  useEffect(() => {
    if (organizationData?.email) {
      loadUnreadCount();

      // Set up periodic refresh every 30 seconds to check for new messages
      const refreshInterval = setInterval(() => {
        loadUnreadCount();
      }, 30000);

      return () => clearInterval(refreshInterval);
    }
  }, [organizationData]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const response = await apiService.getInboxMessages('organiser', organizationData.email);
      if (response.success) {
        setMessages(response.data.messages);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
      setError('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const response = await apiService.getUnreadMessageCount('organiser', organizationData.email);
      if (response.success) {
        setUnreadCount(response.data.unreadCount);
      }
    } catch (error) {
      console.error('Failed to load unread count:', error);
    }
  };

  const handleMessageClick = async (message) => {
    setSelectedMessage(message);
    setShowMessageModal(true);

    // Mark message as read if it's unread
    if (!message.isRead) {
      try {
        await apiService.markMessageAsRead(message.messageId);
        // Update local state
        setMessages(prevMessages =>
          prevMessages.map(m =>
            m.messageId === message.messageId ? { ...m, isRead: true, readAt: new Date() } : m
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (error) {
        console.error('Failed to mark message as read:', error);
      }
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return 'Today';
    } else if (diffDays === 2) {
      return 'Yesterday';
    } else if (diffDays <= 7) {
      return `${diffDays - 1} days ago`;
    } else {
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    }
  };

  const getPriorityIcon = (priority) => {
    return '';
  };

  const getCategoryIcon = (category) => {
    return '';
  };

  const closeMessageModal = () => {
    setShowMessageModal(false);
    setSelectedMessage(null);
  };

  const handleRefresh = () => {
    if (organizationData?.email) {
      loadMessages();
      loadUnreadCount();
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div className="inbox-container" style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        border: '1px solid #e1e5e9',
        overflow: 'hidden',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
        width: '100%',
        maxWidth: '800px',
        maxHeight: '85vh',
        display: 'flex',
        flexDirection: 'column'
      }}>
      {/* Header */}
      <div className="inbox-header" style={{
        backgroundColor: '#2c3e50',
        color: 'white',
        padding: '20px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid #34495e'
      }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>Admin Messages</h3>
          {unreadCount > 0 && (
            <span style={{
              display: 'inline-block',
              marginTop: '4px',
              color: '#bdc3c7',
              fontSize: '13px'
            }}>
              {unreadCount} unread message{unreadCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={handleRefresh}
            style={{
              backgroundColor: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '500',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
            }}
          >
            Refresh
          </button>
          <button
            onClick={onClose}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              fontSize: '24px',
              padding: '0',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              opacity: 0.7
            }}
            onMouseEnter={(e) => {
              e.target.style.opacity = '1';
            }}
            onMouseLeave={(e) => {
              e.target.style.opacity = '0.7';
            }}
          >
            ×
          </button>
        </div>
      </div>

        {/* Messages List */}
        <div className="messages-list" style={{
          flex: 1,
          overflowY: 'auto',
          backgroundColor: 'white',
          minHeight: '400px'
        }}>
        {loading ? (
          <div style={{
            padding: '48px 24px',
            textAlign: 'center'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              border: '3px solid #e1e5e9',
              borderTop: '3px solid #3498db',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 12px'
            }}></div>
            <span style={{ color: '#7f8c8d', fontSize: '14px' }}>Loading messages...</span>
          </div>
        ) : error ? (
          <div style={{
            padding: '48px 24px',
            textAlign: 'center'
          }}>
            <span style={{ color: '#e74c3c', fontSize: '14px' }}>⚠️ {error}</span>
          </div>
        ) : messages.length === 0 ? (
          <div style={{
            padding: '60px 24px',
            textAlign: 'center'
          }}>
            <p style={{ margin: 0, color: '#95a5a6', fontSize: '14px' }}>
              No messages yet
            </p>
          </div>
        ) : (
          messages.map((message, index) => (
              <div
                key={message.messageId}
                onClick={() => handleMessageClick(message)}
                style={{
                  padding: '16px 24px',
                  backgroundColor: message.isRead ? 'white' : '#f8f9fa',
                  borderBottom: '1px solid #ecf0f1',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f8f9fa';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = message.isRead ? 'white' : '#f8f9fa';
                }}
              >
                {!message.isRead && (
                  <div style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: '3px',
                    backgroundColor: '#3498db'
                  }}></div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 style={{
                      margin: '0 0 4px 0',
                      fontWeight: message.isRead ? '500' : '600',
                      fontSize: '14px',
                      color: '#2c3e50',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {message.subject}
                    </h4>

                    <div style={{
                      color: '#7f8c8d',
                      fontSize: '12px',
                      marginBottom: '4px'
                    }}>
                      From: {message.fromName}
                    </div>

                    <div style={{
                      color: '#95a5a6',
                      fontSize: '13px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {message.content}
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    gap: '6px',
                    flexShrink: 0
                  }}>
                    <span style={{
                      fontSize: '12px',
                      color: '#95a5a6'
                    }}>
                      {formatDate(message.createdAt)}
                    </span>
                    {!message.isRead && (
                      <span style={{
                        backgroundColor: '#3498db',
                        color: 'white',
                        fontSize: '10px',
                        padding: '2px 6px',
                        borderRadius: '3px',
                        fontWeight: '600'
                      }}>
                        NEW
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Message Detail Modal */}
      {showMessageModal && selectedMessage && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            maxWidth: '700px',
            width: '100%',
            maxHeight: '85vh',
            overflow: 'hidden',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e1e5e9'
          }}>
            {/* Modal Header */}
            <div style={{
              backgroundColor: '#2c3e50',
              color: 'white',
              padding: '20px 24px',
              borderBottom: '1px solid #34495e'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1, paddingRight: '20px' }}>
                  <h3 style={{
                    margin: '0 0 12px 0',
                    fontSize: '18px',
                    fontWeight: '600'
                  }}>
                    {selectedMessage.subject}
                  </h3>

                  <div style={{
                    fontSize: '14px',
                    color: '#bdc3c7'
                  }}>
                    <div style={{ marginBottom: '4px' }}>
                      <strong>From:</strong> {selectedMessage.fromName}
                    </div>
                    <div>
                      <strong>Date:</strong> {new Date(selectedMessage.createdAt).toLocaleString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                    {selectedMessage.relatedApplicationId && (
                      <div style={{ marginTop: '4px' }}>
                        <strong>Application:</strong> {selectedMessage.relatedApplicationId}
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={closeMessageModal}
                  style={{
                    backgroundColor: 'transparent',
                    border: '1px solid #bdc3c7',
                    borderRadius: '4px',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'white',
                    fontSize: '16px'
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div style={{
              padding: '24px',
              maxHeight: '60vh',
              overflowY: 'auto',
              backgroundColor: 'white'
            }}>
              <div style={{
                fontSize: '15px',
                lineHeight: '1.6',
                color: '#2c3e50',
                whiteSpace: 'pre-wrap'
              }}>
                {selectedMessage.content}
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid #e1e5e9',
              backgroundColor: '#f8f9fa',
              display: 'flex',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={closeMessageModal}
                style={{
                  backgroundColor: '#2c3e50',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Export a button component that can be used to trigger the inbox
export const InboxButton = ({ organizationData, unreadCount, onClick }) => {
  return (
    <button
      onClick={onClick}
      style={{
        position: 'relative',
        width: '100%',
        backgroundColor: '#28a745',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        padding: '10px 15px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: 'normal',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        transition: 'background-color 0.2s ease'
      }}
      onMouseEnter={(e) => {
        e.target.style.backgroundColor = '#218838';
      }}
      onMouseLeave={(e) => {
        e.target.style.backgroundColor = '#28a745';
      }}
    >
      <span>Inbox</span>
      {unreadCount > 0 && (
        <div style={{
          position: 'absolute',
          top: '-6px',
          right: '-6px',
          backgroundColor: '#ff4757',
          color: 'white',
          borderRadius: '50%',
          width: '22px',
          height: '22px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '11px',
          fontWeight: '600',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
          animation: unreadCount > 0 ? 'pulse 2s infinite' : 'none',
          border: '2px solid white'
        }}>
          {unreadCount > 9 ? '9+' : unreadCount}
        </div>
      )}
    </button>
  );
};

export default OrganiserInbox;