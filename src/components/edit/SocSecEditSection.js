import React from 'react';
import { logAuditEvent } from '../../services/auditService';
import { DeleteIcon, UndoIcon } from './EditIcons';
import { autoFormatSsn } from '../../hooks/useValidation';

const SocSecEditSection = ({ editData, handleListItemChange, setEditData, canDelete, errors, onConfirmDelete }) => {

    const handleAdd = () => {
        logAuditEvent('ADD_SOC_SEC_CLICK');
        setEditData([...editData, { id: null, socSec: '' }]);
    };

    const handleDelete = (index, record) => {
        const isNew = record.id === null;
        const isEmpty = !record.socSec || !record.socSec.trim();

        if (isNew && isEmpty) {
            logAuditEvent('DELETE_NEW_EMPTY_SSN');
            setEditData(editData.filter((_, i) => i !== index));
            return;
        }

        const isCurrentlyMarked = !!record._isMarkedForDeletion;
        
        const executeToggleDeletion = () => {
            const updatedData = [...editData]; // Get copy

            if (!isCurrentlyMarked) {
                logAuditEvent('MARK_SOC_SEC_FOR_DELETION', { record });
                updatedData[index]._isMarkedForDeletion = true;
            } else {
                logAuditEvent('UNDO_SOC_SEC_CAUTION', { record });
                
                // MODIFIED: Delete the property
                delete updatedData[index]._isMarkedForDeletion;

                // Re-run validation
                handleListItemChange('appendedSsns', index, 'socSec', updatedData[index].socSec);
            }

            setEditData(updatedData);
        };
        
        if (isCurrentlyMarked) {
            executeToggleDeletion();
        } else {
            onConfirmDelete(
                "Do you want to mark this Social Security Number for deletion? The change will be permanent when you click Save.",
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
                            value={item.socSec || ''}
                            // UPDATED: Use handler from props and apply auto-formatting
                            onChange={(e) => handleListItemChange('appendedSsns', index, 'socSec', autoFormatSsn(e.target.value))}
                            placeholder="XXX-XX-XXXX"
                            maxLength="11"
                            aria-label={`Social Security Number ${index + 1}`}
                            disabled={item._isMarkedForDeletion}
                        />
                        {/* BUG FIX: The error key should use the correct data model key 'appendedSsns' */}
                        {errors?.[`appendedSsns[${index}].socSec`] &&
                            <span className="field-error-text" role="alert">{errors[`appendedSsns[${index}].socSec`]}</span>
                        }
                        {canDelete && (
                            <button
                                onClick={() => handleDelete(index, item)}
                                className={`delete-button ${item._isMarkedForDeletion ? 'undo' : ''}`}
                                aria-label={item._isMarkedForDeletion ? `Undo deletion for SSN ${index + 1}` : `Mark SSN ${index + 1} for deletion`}
                                title={item._isMarkedForDeletion ? "Undo Deletion" : "Mark for Deletion"}
                            >
                                {item._isMarkedForDeletion ? <UndoIcon /> : <DeleteIcon />}
                            </button>
                        )}
                    </div>
                ))
            ) : (
                <p className="no-records-text">No additional Social Security Numbers exist for this record.</p>
            )}
            <button onClick={handleAdd} className="add-button">Add New SSN</button>
        </div>
    );
};

export default SocSecEditSection;