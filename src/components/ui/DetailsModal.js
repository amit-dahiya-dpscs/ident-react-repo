import React, { useEffect, useRef } from 'react';
import DetailsView from '../DetailsView';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import './DetailsModal.css';

const DetailsModal = ({ data, onClose, onRecordUpdate }) => {
    // Use the custom hook to trap focus within the modal.
    const modalRef = useFocusTrap(true);
    
    // Create a ref to store a reference to the element that opened the modal.
    const triggerRef = useRef(document.activeElement);

    //  Create a ref for the DetailsView component
    const detailsViewRef = useRef(null);

    // Create a new handler for all close actions
    const handleCloseRequest = () => {
        if (detailsViewRef.current) {
            // Call the exposed function inside DetailsView
            detailsViewRef.current.handleBackToSearch();
        } else {
            // Fallback just in case
            onClose();
        }
    };

    useEffect(() => {
        const triggerElement = triggerRef.current;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                if (detailsViewRef.current) {
                    detailsViewRef.current.handleBackToSearch();
                } else {
                    onClose();
                }
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            triggerElement?.focus();
        };
    }, [onClose]);

    return (
        <div className="modal-overlay" onClick={handleCloseRequest}>
            <div 
                ref={modalRef}
                className="modal-content" 
                onClick={e => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
            >
                <button className="modal-close-button" onClick={handleCloseRequest} aria-label="Close dialog">×</button>
                {/* The h2 inside DetailsView needs id="modal-title" for this to work */}
                <DetailsView ref={detailsViewRef} data={data} isModal={true} onRecordUpdate={onRecordUpdate} backToSearch={onClose} onClose={onClose} />
            </div>
        </div>
    );
};

export default DetailsModal;