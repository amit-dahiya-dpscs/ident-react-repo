import React from 'react';
import { logAuditEvent } from '../../services/auditService';
import { DeleteIcon, UndoIcon } from './EditIcons'; // Import UndoIcon
import { autoFormatDate } from '../../hooks/useValidation'; // Import auto-formatter

/**
 * A dedicated component for rendering the editable form for the "Reference" section.
 */
// Props updated to include handlers and errors from the parent
const ReferenceEditSection = ({ editData, setEditData, canDelete, handleListItemChange, errors, onInitiateDeletion, recordData, pendingDeletionIndex }) => {

    // Local handleChange function REMOVED to use the centralized handler from props.

    /**
     * Adds a new, blank Reference object to the end of the editData array.
     */
    const handleAdd = () => {
        logAuditEvent('ADD_REFERENCE_CLICK');
        setEditData([...editData, {
            id: null,
            referenceDate: '',
            type: '',
            number: '',
            description: ''
        }]);
    };

    /**
     * handleDelete completely refactored to use the "mark for deletion" pattern.
     */
    const handleDelete = (index, record) => {
        // Check 1: Is this a new, unsaved row? (This logic is correct)
        if (!record.id) {
            logAuditEvent('DELETE_NEW_REFERENCE_CLICK');
            const updatedData = editData.filter((_, i) => i !== index);
            setEditData(updatedData);
            return; // Stop execution
        }

        // Check 2: Is this an UNDO action?
        if (record._isMarkedForDeletion) {
            logAuditEvent('UNDO_PART_CANCEL_REFERENCE', { recordId: record.id });
            const updatedData = [...editData];
            
            // Delete the properties to revert it to its original state
            delete updatedData[index]._isMarkedForDeletion;
            delete updatedData[index]._deletionReason;
            
            setEditData(updatedData);
            return; // Stop execution to prevent the modal from showing
        }
        
       
        // This code will now only run if it's a new deletion, not an undo.
        const activeRecordsCount = editData.filter(item => !item._isMarkedForDeletion).length;
        
        if (activeRecordsCount === 1) {
            // If this is the last existing item, trigger "Cancel Entire"
            onInitiateDeletion('Cancel Entire', { SID: recordData.sid }, index);
        } else {
            // Otherwise, trigger "Part Cancel" for an existing item
            onInitiateDeletion('Part Cancel', { 'Date': record.referenceDate, 'Type': record.type, 'Number': record.number }, index);
        }
    };

    return (
        <div className="editable-table-container">
            <div className="editable-record-row reference-grid header-row">
                <span className="detail-label">Date:</span>
                <span className="detail-label">Type:</span>
                <span className="detail-label">Number:</span>
                <span className="detail-label">Description:</span>
                {canDelete && <div />}
            </div>

            {editData.length > 0 ? (
                editData.map((record, index) => {
                    
                    const dateError = errors?.[`references[${index}].referenceDate`];
                    const typeError = errors?.[`references[${index}].type`];
                    const numberError = errors?.[`references[${index}].number`];
                    const descriptionError = errors?.[`references[${index}].description`];
                    
                    // Display the first error found for the row
                    const rowError = dateError || typeError || numberError || descriptionError;

                    // This flag is true for existing records and false for new ones
                    const isExistingRecord = !!record.id;

                    const isPendingDeletion = pendingDeletionIndex === index;

                    return (
                        <div
                            key={record.id || `new-${index}`}
                            className={`editable-record-row reference-grid ${record._isMarkedForDeletion ? 'marked-for-deletion' : ''} ${isPendingDeletion ? 'pending-deletion-highlight' : ''}`}
                        >
                            <div className="detail-item">
                                <input
                                    type="text"
                                    className={`detail-value-edit ${isExistingRecord ? 'read-only-in-edit' : ''}`}
                                    readOnly={isExistingRecord}
                                    value={record.referenceDate || ''}
                                    onChange={(e) => handleListItemChange('references', index, 'referenceDate', autoFormatDate(e.target.value))}
                                    placeholder="MM/DD/YYYY"
                                    maxLength="10"
                                    aria-label={`Reference date for row ${index + 1}`}
                                    disabled={record._isMarkedForDeletion}
                                />
                            </div>
                            
                            <div className="detail-item">
                                <input
                                    type="text"
                                    className={`detail-value-edit ${isExistingRecord ? 'read-only-in-edit' : ''}`}
                                    readOnly={isExistingRecord}
                                    value={record.type || ''}
                                    onChange={(e) => handleListItemChange('references', index, 'type', e.target.value)}
                                    aria-label={`Reference type for row ${index + 1}`}
                                    disabled={record._isMarkedForDeletion}
                                />
                            </div>
                            
                            <div className="detail-item">
                                <input
                                    type="text"
                                    className={`detail-value-edit ${isExistingRecord ? 'read-only-in-edit' : ''}`}
                                    readOnly={isExistingRecord}
                                    value={record.number || ''}
                                    onChange={(e) => handleListItemChange('references', index, 'number', e.target.value)}
                                    aria-label={`Reference number for row ${index + 1}`}
                                    disabled={record._isMarkedForDeletion}
                                />
                            </div>
                            
                            <div className="detail-item">
                                <input
                                    type="text"
                                    className="detail-value-edit"
                                    value={record.description || ''}
                                    onChange={(e) => handleListItemChange('references', index, 'description', e.target.value)}
                                    aria-label={`Reference description for row ${index + 1}`}
                                    disabled={record._isMarkedForDeletion}
                                />
                            </div>
                            
                            {canDelete && (
                                <div className="delete-action-cell">
                                    <button
                                        onClick={() => handleDelete(index, record)}
                                        className={`delete-button ${record._isMarkedForDeletion ? 'undo' : ''}`}
                                        aria-label={`Delete reference row ${index + 1}`}
                                        title={record._isMarkedForDeletion ? "Undo Deletion" : "Mark for Deletion"}
                                    >
                                        {record._isMarkedForDeletion ? <UndoIcon /> : <DeleteIcon />}
                                    </button>
                                </div>
                            )}

                            {rowError && (
                                <div className="reference-error-container">
                                    <span className="field-error-text" role="alert">
                                        {rowError}
                                    </span>
                                </div>
                            )}
                        </div>
                    );
                })
            ) : (
                <p className="no-records-text">No references exist for this record.</p>
            )}
            <button onClick={handleAdd} className="add-button">Add New Reference</button>
        </div>
    );
};

export default ReferenceEditSection;