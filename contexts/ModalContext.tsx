import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { CloseIcon } from '../components/Icons';

interface ModalAction {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'danger' | 'secondary';
}

interface ModalState {
    isOpen: boolean;
    title: string;
    content: React.ReactNode;
    actions: ModalAction[];
}

interface ModalContextType {
    showConfirm: (config: {
        title: string;
        content: React.ReactNode;
        onConfirm: () => void;
        confirmVariant?: 'primary' | 'danger';
        confirmLabel?: string;
    }) => void;
    showAlert: (config: {
        title: string;
        content: React.ReactNode;
        onOk?: () => void;
    }) => void;
    hideModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const useModal = () => {
    const context = useContext(ModalContext);
    if (!context) {
        throw new Error('useModal must be used within a ModalProvider');
    }
    return context;
};

const ModalComponent: React.FC<ModalState & { hideModal: () => void }> = ({ isOpen, title, content, actions, hideModal }) => {
    const [isClosing, setIsClosing] = useState(false);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                handleClose();
            }
        };
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
        }
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen]);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            hideModal();
            setIsClosing(false);
        }, 200); // Duration must match animation
    };
    
    const getButtonClass = (variant: ModalAction['variant']) => {
        switch (variant) {
            case 'primary': return 'bg-[var(--bg-accent)] hover:bg-[var(--bg-accent-hover)] text-[var(--text-on-accent)]';
            case 'danger': return 'bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white';
            case 'secondary':
            default: return 'bg-[var(--bg-muted)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)]';
        }
    };

    if (!isOpen && !isClosing) return null;

    return (
        <div 
            className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-200 ${isOpen && !isClosing ? 'opacity-100' : 'opacity-0'}`} 
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
        >
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={handleClose} aria-hidden="true"></div>
            <div 
                className={`bg-[var(--bg-secondary)] rounded-lg shadow-xl w-full max-w-md transform transition-all duration-200 ${isOpen && !isClosing ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
                onClick={e => e.stopPropagation()}
            >
                <div className="p-6">
                    <div className="flex justify-between items-start">
                        <h3 id="modal-title" className="text-xl font-bold text-[var(--text-primary)]">{title}</h3>
                        <button onClick={handleClose} className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-full hover:bg-[var(--bg-hover)]" aria-label="Tutup">
                            <CloseIcon className="text-lg" />
                        </button>
                    </div>
                    <div className="mt-4 text-[var(--text-secondary)]">
                        {typeof content === 'string' ? <p>{content}</p> : content}
                    </div>
                </div>
                <div className="bg-[var(--bg-tertiary)] px-6 py-4 flex justify-end space-x-3 rounded-b-lg">
                    {actions.map((action, index) => (
                        <button 
                            key={index} 
                            onClick={action.onClick}
                            className={`font-semibold py-2 px-4 rounded-lg transition-colors duration-200 ${getButtonClass(action.variant)}`}
                        >
                            {action.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export const ModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [modalState, setModalState] = useState<ModalState>({ isOpen: false, title: '', content: null, actions: [] });

    const hideModal = useCallback(() => {
        setModalState(prev => ({ ...prev, isOpen: false }));
    }, []);

    const showConfirm = useCallback(({ title, content, onConfirm, confirmVariant = 'primary', confirmLabel = 'Konfirmasi' }: {
        title: string;
        content: React.ReactNode;
        onConfirm: () => void;
        confirmVariant?: 'primary' | 'danger';
        confirmLabel?: string;
    }) => {
        setModalState({
            isOpen: true,
            title,
            content,
            actions: [
                { label: 'Batal', onClick: hideModal, variant: 'secondary' },
                {
                    label: confirmLabel,
                    onClick: () => {
                        onConfirm();
                        hideModal();
                    },
                    variant: confirmVariant
                }
            ]
        });
    }, [hideModal]);

    const showAlert = useCallback(({ title, content, onOk }: {
        title: string;
        content: React.ReactNode;
        onOk?: () => void;
    }) => {
        setModalState({
            isOpen: true,
            title,
            content,
            actions: [
                {
                    label: 'OK',
                    onClick: () => {
                        if (onOk) onOk();
                        hideModal();
                    },
                    variant: 'primary'
                }
            ]
        });
    }, [hideModal]);

    const value = { showConfirm, showAlert, hideModal };

    return (
        <ModalContext.Provider value={value}>
            {children}
            <ModalComponent {...modalState} hideModal={hideModal} />
        </ModalContext.Provider>
    );
};