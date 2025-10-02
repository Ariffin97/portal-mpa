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
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '18px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Admin Messages</h3>
            {unreadCount > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                <span style={{
                  backgroundColor: '#ff4757',
                  color: 'white',
                  borderRadius: '10px',
                  padding: '2px 8px',
                  fontSize: '11px',
                  fontWeight: '600',
                  minWidth: '18px',
                  textAlign: 'center'
                }}>
                  {unreadCount}
                </span>
                <span style={{ fontSize: '12px', opacity: 0.9 }}>unread</span>
              </div>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleRefresh}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              color: 'white',
              padding: '8px 14px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.25)';
              e.target.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            <span>Refresh</span>
          </button>
          <button
            onClick={onClose}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              borderRadius: '8px',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'white',
              fontSize: '18px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
              e.target.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
              e.target.style.transform = 'scale(1)';
            }}
          >
            ✕
          </button>
        </div>
      </div>

        {/* Messages List */}
        <div className="messages-list" style={{
          flex: 1,
          overflowY: 'auto',
          backgroundColor: '#fafbfc',
          minHeight: '400px'
        }}>
        {loading ? (
          <div style={{
            padding: '48px 24px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              border: '3px solid #e1e5e9',
              borderTop: '3px solid #667eea',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
            <span style={{ color: '#6c757d', fontSize: '14px' }}>Loading messages...</span>
          </div>
        ) : error ? (
          <div style={{
            padding: '48px 24px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{
              backgroundColor: '#fee2e2',
              borderRadius: '50%',
              padding: '12px',
              display: 'inline-flex'
            }}>
              <span style={{ fontSize: '20px' }}>⚠️</span>
            </div>
            <span style={{ color: '#dc3545', fontSize: '14px', fontWeight: '500' }}>{error}</span>
          </div>
        ) : messages.length === 0 ? (
          <div style={{
            padding: '48px 24px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px'
          }}>
            <div style={{
              backgroundColor: '#f0f4f8',
              borderRadius: '50%',
              padding: '16px',
              display: 'inline-flex'
            }}>
              <span style={{ fontSize: '24px' }}>📬</span>
            </div>
            <div>
              <h4 style={{ margin: '0 0 8px 0', color: '#2d3748', fontSize: '16px', fontWeight: '600' }}>
                No messages yet
              </h4>
              <p style={{ margin: 0, color: '#718096', fontSize: '14px', lineHeight: '1.5' }}>
                You'll receive important updates and notifications from the admin team here.
              </p>
            </div>
          </div>
        ) : (
          <div style={{ padding: '8px 0' }}>
            {messages.map((message, index) => (
              <div
                key={message.messageId}
                onClick={() => handleMessageClick(message)}
                style={{
                  margin: '0 16px 8px 16px',
                  padding: '16px 20px',
                  backgroundColor: message.isRead ? 'white' : '#f7faff',
                  border: message.isRead ? '1px solid #e1e5e9' : '1px solid #c3dafe',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  boxShadow: message.isRead ? '0 1px 3px rgba(0, 0, 0, 0.02)' : '0 2px 8px rgba(99, 126, 234, 0.08)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = message.isRead ? '0 1px 3px rgba(0, 0, 0, 0.02)' : '0 2px 8px rgba(99, 126, 234, 0.08)';
                }}
              >
                {/* Priority indicator stripe */}
                {!message.isRead && (
                  <div style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: '4px',
                    backgroundColor: message.priority === 'urgent' ? '#ff4757' :
                                   message.priority === 'high' ? '#ffa502' :
                                   message.priority === 'normal' ? '#2ed573' : '#5352ed',
                    borderRadius: '12px 0 0 12px'
                  }}></div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Message header with icons and subject */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <span style={{ fontSize: '14px' }}>{getPriorityIcon(message.priority)}</span>
                      <span style={{ fontSize: '14px' }}>{getCategoryIcon(message.category)}</span>
                      <h4 style={{
                        margin: 0,
                        fontWeight: message.isRead ? '500' : '600',
                        fontSize: '15px',
                        color: '#2d3748',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        flex: 1
                      }}>
                        {message.subject}
                      </h4>
                    </div>

                    {/* From information */}
                    <div style={{
                      color: '#718096',
                      fontSize: '13px',
                      marginBottom: '6px',
                      fontWeight: '500'
                    }}>
                      From: {message.fromName}
                    </div>

                    {/* Message preview */}
                    <div style={{
                      color: '#a0aec0',
                      fontSize: '13px',
                      lineHeight: '1.4',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: '100%'
                    }}>
                      {message.content}
                    </div>
                  </div>

                  {/* Right side - date and unread indicator */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    gap: '4px',
                    flexShrink: 0
                  }}>
                    <span style={{
                      fontSize: '12px',
                      color: '#a0aec0',
                      fontWeight: '500'
                    }}>
                      {formatDate(message.createdAt)}
                    </span>
                    {!message.isRead && (
                      <div style={{
                        backgroundColor: '#667eea',
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        boxShadow: '0 0 0 2px rgba(102, 126, 234, 0.2)'
                      }}></div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
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
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            maxWidth: '700px',
            width: '100%',
            maxHeight: '85vh',
            overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
            transform: 'scale(1)',
            animation: 'slideUp 0.3s ease-out'
          }}>
            {/* Modal Header */}
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              padding: '24px 28px',
              position: 'relative'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1, paddingRight: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <h3 style={{
                      margin: 0,
                      fontSize: '20px',
                      fontWeight: '600',
                      lineHeight: '1.3',
                      wordBreak: 'break-word'
                    }}>
                      {selectedMessage.subject}
                    </h3>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '12px',
                    fontSize: '14px',
                    opacity: 0.95
                  }}>
                    <div>
                      <strong style={{ opacity: 0.8 }}>From:</strong> {selectedMessage.fromName}
                    </div>
                    <div>
                      <strong style={{ opacity: 0.8 }}>Date:</strong> {new Date(selectedMessage.createdAt).toLocaleString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                    {selectedMessage.relatedApplicationId && (
                      <div style={{ gridColumn: '1 / -1' }}>
                        <strong style={{ opacity: 0.8 }}>Related Application:</strong>
                        <span style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.2)',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          marginLeft: '8px',
                          fontSize: '13px',
                          fontWeight: '500'
                        }}>
                          {selectedMessage.relatedApplicationId}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={closeMessageModal}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    border: 'none',
                    borderRadius: '8px',
                    width: '36px',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'white',
                    fontSize: '18px',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
                    e.target.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                    e.target.style.transform = 'scale(1)';
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div style={{
              padding: '28px',
              maxHeight: '60vh',
              overflowY: 'auto',
              backgroundColor: '#fafbfc'
            }}>
              <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '24px',
                border: '1px solid #e1e5e9',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)'
              }}>
                <div style={{
                  fontSize: '15px',
                  lineHeight: '1.7',
                  color: '#2d3748',
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'system-ui, -apple-system, sans-serif'
                }}>
                  {selectedMessage.content}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '20px 28px',
              borderTop: '1px solid #e1e5e9',
              backgroundColor: 'white',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px'
            }}>
              <button
                onClick={closeMessageModal}
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 4px rgba(102, 126, 234, 0.2)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = '0 4px 8px rgba(102, 126, 234, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 2px 4px rgba(102, 126, 234, 0.2)';
                }}
              >
                Close Message
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