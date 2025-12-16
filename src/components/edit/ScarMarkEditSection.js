import React from 'react';
import { logAuditEvent } from '../../services/auditService';
import { DeleteIcon, UndoIcon } from './EditIcons';

const ScarMarkEditSection = ({ editData, handleListItemChange, setEditData, canDelete, errors, onConfirmDelete }) => {

    const handleAdd = () => {
        logAuditEvent('ADD_SCAR_MARK_CLICK');
        setEditData([...editData, { id: null, scarMark: '' }]);
    };

    const handleDelete = (index, record) => {
        const isNew = record.id === null;
        const isEmpty = !record.scarMark || !record.scarMark.trim();

        if (isNew && isEmpty) {
            logAuditEvent('DELETE_NEW_EMPTY_SCAR_MARK');
            setEditData(editData.filter((_, i) => i !== index));
            return;
        }

        const isCurrentlyMarked = !!record._isMarkedForDeletion;
        
        const executeToggleDeletion = () => {
            const updatedData = [...editData]; // Get copy

            if (!isCurrentlyMarked) {
                logAuditEvent('MARK_SCAR_MARK_FOR_DELETION', { record });
                updatedData[index]._isMarkedForDeletion = true;
            } else {
                logAuditEvent('UNDO_SCAR_MARK_CAUTION', { record });
                
                // MODIFIED: Delete the property
                delete updatedData[index]._isMarkedForDeletion;

                // Re-run validation
                handleListItemChange('appendedScarsMarks', index, 'scarMark', updatedData[index].scarMark);
            }

            setEditData(updatedData);
        };
        
        if (isCurrentlyMarked) {
            executeToggleDeletion();
        } else {
            onConfirmDelete(
                "Do you want to mark this Scar/Mark for deletion? The change will be permanent when you click Save.",
                executeToggleDeletion
            );
        }
    };

    return (
        <div className="editable-list-container">
            {editData && editData.length > 0 ? (
                editData.map((scar, index) => (
                    <div
                        key={scar.id || `new-${index}`}
                        className={`editable-list-item ${scar._isMarkedForDeletion ? 'marked-for-deletion' : ''}`}
                    >
                        {/* --- THIS WRAPPER DIV WAS MISSING --- */}
                        <div className="detail-item full-width">
                            <input
                                type="text"
                                className="detail-value-edit"
                                value={scar.scarMark || ''}
                                onChange={(e) => handleListItemChange('appendedScarsMarks', index, 'scarMark', e.target.value)}
                                placeholder="Enter Scar/Mark Code"
                                aria-label={`Scar/Mark ${index + 1}`}
                                disabled={scar._isMarkedForDeletion}
                            />
                            {/* This error message will now be positioned correctly relative to this wrapper */}
                            {errors?.[`appendedScarsMarks[${index}].scarMark`] &&
                                <span className="field-error-text" role="alert">{errors[`appendedScarsMarks[${index}].scarMark`]}</span>
                            }
                        </div>
                        {canDelete && (
                            <button
                                onClick={() => handleDelete(index, scar)}
                                className={`delete-button ${scar._isMarkedForDeletion ? 'undo' : ''}`}
                                aria-label={scar._isMarkedForDeletion ? `Undo deletion for scar/mark ${index + 1}` : `Mark scar/mark ${index + 1} for deletion`}
                                title={scar._isMarkedForDeletion ? "Undo Deletion" : "Mark for Deletion"}
                            >
                                {scar._isMarkedForDeletion ? <UndoIcon /> : <DeleteIcon />}
                            </button>
                        )}
                    </div>
                ))
            ) : (
                <p className="no-records-text">No scars or marks exist for this record.</p>
            )}
            <button onClick={handleAdd} className="add-button">Add New Scar/Mark</button>
        </div>
    );
};

export default ScarMarkEditSection;