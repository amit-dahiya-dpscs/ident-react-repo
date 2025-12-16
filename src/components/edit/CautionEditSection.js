import React from 'react';
import { useReferenceData } from '../../context/ReferenceDataContext';
import { logAuditEvent } from '../../services/auditService';
import { DeleteIcon, UndoIcon } from './EditIcons.js';

const CautionEditSection = ({ editData, handleListItemChange, setEditData, canDelete, errors, onConfirmDelete }) => {
    const { cautionCodes } = useReferenceData();

    const handleAdd = () => {
        logAuditEvent('ADD_CAUTION_CLICK');
        setEditData([...editData, { id: null, cautionCode: '' }]);
    };

    const handleDelete = (index, record) => {
        // If the record is new (no ID) and the code is empty, remove it directly.
        const isNew = record.id === null;
        const isEmpty = !record.cautionCode || !record.cautionCode.trim();

        if (isNew && isEmpty) {
            logAuditEvent('DELETE_NEW_EMPTY_CAUTION');
            setEditData(editData.filter((_, i) => i !== index));
            return;
        }

        const isCurrentlyMarked = !!record._isMarkedForDeletion;

        // This function holds the logic to run after confirmation
        const executeToggleDeletion = () => {
            const updatedData = [...editData]; // Get copy

            if (!isCurrentlyMarked) {
                logAuditEvent('MARK_CAUTION_FOR_DELETION', { record });
                updatedData[index]._isMarkedForDeletion = true;
            } else {
                logAuditEvent('UNDO_DELETE_CAUTION', { record });
                
                // MODIFIED: Delete the property
                delete updatedData[index]._isMarkedForDeletion;

                // Re-run validation
                handleListItemChange('appendedCautions', index, 'cautionCode', updatedData[index].cautionCode);
            }
            
            setEditData(updatedData);
        };
        
        // If undoing, run immediately. Otherwise, ask parent for confirmation.
        if (isCurrentlyMarked) {
            executeToggleDeletion();
        } else {
            onConfirmDelete(
                "Do you want to mark this Caution for deletion? The change will be permanent when you click Save.",
                executeToggleDeletion
            );
        }
    };

    return (
        <div className="editable-list-container">
            {editData && editData.length > 0 ? (
                editData.map((caution, index) => (
                    <div
                        key={caution.id || `new-${index}`}
                        className={`editable-list-item ${caution._isMarkedForDeletion ? 'marked-for-deletion' : ''}`}
                    >
                        <select
                            className="detail-value-edit"
                            value={caution.cautionCode || ''}
                            onChange={(e) => handleListItemChange('appendedCautions', index, 'cautionCode', e.target.value)}
                            aria-label={`Caution ${index + 1}`}
                            disabled={caution._isMarkedForDeletion}
                        >
                            <option value="">-- Select Caution --</option>
                            {Object.entries(cautionCodes).map(([code, description]) => (
                                <option key={code} value={code}>
                                    {`${code} - ${description}`}
                                </option>
                            ))}
                        </select>
                        {errors?.[`appendedCautions[${index}].cautionCode`] &&
                            <span className="field-error-text" role="alert">{errors[`appendedCautions[${index}].cautionCode`]}</span>
                        }
                        {canDelete && (
                            <button
                                onClick={() => handleDelete(index, caution)}
                                className={`delete-button ${caution._isMarkedForDeletion ? 'undo' : ''}`}
                                aria-label={caution._isMarkedForDeletion ? `Undo deletion for caution ${index + 1}` : `Mark caution ${index + 1} for deletion`}
                                title={caution._isMarkedForDeletion ? "Undo Deletion" : "Mark for Deletion"}
                            >
                                {caution._isMarkedForDeletion ? <UndoIcon /> : <DeleteIcon />}
                            </button>
                        )}
                    </div>
                ))
            ) : (
                <p className="no-records-text">No cautions exist for this record.</p>
            )}
            <button onClick={handleAdd} className="add-button">Add New Caution</button>
        </div>
    );
};

export default CautionEditSection;