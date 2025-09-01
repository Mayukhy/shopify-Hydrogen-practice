import {createContext, useContext, useEffect, useState} from 'react';

const QuickAddContext = createContext();

export function QuickAddProvider({children}) {
  const [openModalId, setOpenModalId] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  // Check for mobile on client side only
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const checkMobile = () => {
        setIsMobile(window.innerWidth <= 768);
      };
      // Initial check
      checkMobile();
      window.addEventListener('resize', checkMobile);
      return () => {
        window.removeEventListener('resize', checkMobile);
      };
    }
  }, []);
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
        isMobile
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
