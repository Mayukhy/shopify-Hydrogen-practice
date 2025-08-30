import {createContext, useContext, useState} from 'react';

const QuickAddContext = createContext();

export function QuickAddProvider({children}) {
  const [openModalId, setOpenModalId] = useState(null);

  const openModal = (productId) => {
    setOpenModalId(productId);
  };

  const closeModal = () => {
    setOpenModalId(null);
  };

  const isModalOpen = (productId) => {
    return openModalId === productId;
  };

  return (
    <QuickAddContext.Provider
      value={{
        openModal,
        closeModal,
        isModalOpen,
      }}
    >
      {children}
    </QuickAddContext.Provider>
  );
}

export function useQuickAdd() {
  const context = useContext(QuickAddContext);
  if (!context) {
    throw new Error('useQuickAdd must be used within a QuickAddProvider');
  }
  return context;
}
