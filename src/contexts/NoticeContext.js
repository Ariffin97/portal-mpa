import React, { createContext, useContext, useState } from 'react';

const NoticeContext = createContext();

export const useNotices = () => {
  const context = useContext(NoticeContext);
  if (!context) {
    throw new Error('useNotices must be used within a NoticeProvider');
  }
  return context;
};

export const NoticeProvider = ({ children }) => {
  const [notices, setNotices] = useState([
    {
      id: 1,
      type: 'urgent',
      title: 'Tournament Registration Fee Cap',
      content: 'All tournament organizers must comply with the new registration fee cap of RM200 per Malaysian participant. This is now mandatory for all sanctioned tournaments.',
      date: '2024-12-12',
      active: true,
      actions: []
    }
  ]);

  const addNotice = (notice) => {
    const newNotice = {
      ...notice,
      id: Date.now()
    };
    setNotices(prev => [newNotice, ...prev]);
  };

  const updateNotice = (id, updatedNotice) => {
    setNotices(prev => prev.map(notice => 
      notice.id === id ? { ...updatedNotice, id } : notice
    ));
  };

  const deleteNotice = (id) => {
    setNotices(prev => prev.filter(notice => notice.id !== id));
  };

  const toggleNoticeActive = (id) => {
    setNotices(prev => prev.map(notice => 
      notice.id === id ? { ...notice, active: !notice.active } : notice
    ));
  };

  const getActiveNotices = () => {
    return notices.filter(notice => notice.active);
  };

  return (
    <NoticeContext.Provider value={{
      notices,
      setNotices,
      addNotice,
      updateNotice,
      deleteNotice,
      toggleNoticeActive,
      getActiveNotices
    }}>
      {children}
    </NoticeContext.Provider>
  );
};