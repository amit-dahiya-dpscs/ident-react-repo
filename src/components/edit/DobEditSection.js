import React from 'react';
import { logAuditEvent } from '../../services/auditService';
import { DeleteIcon, UndoIcon } from './EditIcons';
import { autoFormatDate } from '../../hooks/useValidation';

const DobEditSection = ({ editData, handleListItemChange, setEditData, canDelete, errors, onConfirmDelete }) => {

    const handleAdd = () => {
        logAuditEvent('ADD_APPENDED_DOB_CLICK');
        setEditData([...editData, { id: null, dob: '' }]);
    };

    const handleDelete = (index, record) => {
        const isNew = record.id === null;
        const isEmpty = !record.dob || !record.dob.trim();

        if (isNew && isEmpty) {
            logAuditEvent('DELETE_NEW_EMPTY_DOB');
            setEditData(editData.filter((_, i) => i !== index));
            return;
        }

        const isCurrentlyMarked = !!record._isMarkedForDeletion;
        
        const executeToggleDeletion = () => {
            const updatedData = [...editData]; // Get copy

            if (!isCurrentlyMarked) {
                logAuditEvent('MARK_DOB_FOR_DELETION', { record });
                updatedData[index]._isMarkedForDeletion = true;
            } else {
                logAuditEvent('UNDO_DELETE_DOB', { record });
                
                // MODIFIED: Delete the property
                delete updatedData[index]._isMarkedForDeletion;

                // Re-run validation
                handleListItemChange('appendedDobs', index, 'dob', updatedData[index].dob);
            }

            setEditData(updatedData);
        };
        
        if (isCurrentlyMarked) {
            executeToggleDeletion();
        } else {
            onConfirmDelete(
                "Do you want to mark this DOB for deletion? The change will be permanent when you click Save.",
                executeToggleDeletion
            );
        }
    };

    return (
        <div className="editable-list-container">
            {editData && editData.length > 0 ? (
                editData.map((item, index) => (
                    <div
                        key={item.id || `new-${index}`}
                        className={`editable-list-item ${item._isMarkedForDeletion ? 'marked-for-deletion' : ''}`}
                    >
                        <input
                            type="text"
                            className="detail-value-edit"
                            value={item.dob || ''}
                            onChange={(e) => handleListItemChange('appendedDobs', index, 'dob', autoFormatDate(e.target.value))}
                            placeholder="MM/DD/YYYY"
                            maxLength="10"
                            aria-label={`Appended DOB ${index + 1}`}
                            disabled={item._isMarkedForDeletion}
                        />
                        {errors?.[`appendedDobs[${index}].dob`] &&
                            <span className="field-error-text" role="alert">{errors[`appendedDobs[${index}].dob`]}</span>
                        }
                        {canDelete && (
                            <button
                                onClick={() => handleDelete(index, item)}
                                className={`delete-button ${item._isMarkedForDeletion ? 'undo' : ''}`}
                                aria-label={item._isMarkedForDeletion ? `Undo deletion for DOB ${index + 1}` : `Mark DOB ${index + 1} for deletion`}
                                title={item._isMarkedForDeletion ? "Undo Deletion" : "Mark for Deletion"}
                            >
                                {item._isMarkedForDeletion ? <UndoIcon /> : <DeleteIcon />}
                            </button>
                        )}
                    </div>
                ))
            ) : (
                <p className="no-records-text">No additional Dates of Birth exist for this record.</p>
            )}
            <button onClick={handleAdd} className="add-button">Add New DOB</button>
        </div>
    );
};

export default DobEditSection;