import React from 'react';
import { logAuditEvent } from '../../services/auditService';
import { DeleteIcon, UndoIcon } from './EditIcons';

const MiscNumEditSection = ({ editData, handleListItemChange, setEditData, canDelete, errors, onConfirmDelete }) => {

    const handleAdd = () => {
        logAuditEvent('ADD_MISC_NUMBER_CLICK');
        setEditData([...editData, { id: null, prefix: '', number: '' }]);
    };

    const handleDelete = (index, record) => {
        const isNew = record.id === null;
        const isEmpty = !(record.prefix || '').trim() && !(record.number || '').trim();

        if (isNew && isEmpty) {
            logAuditEvent('DELETE_NEW_EMPTY_MISC_NUM');
            setEditData(editData.filter((_, i) => i !== index));
            return;
        }

        const isCurrentlyMarked = !!record._isMarkedForDeletion;

        const executeToggleDeletion = () => {
            const updatedData = [...editData]; // Get copy

            if (!isCurrentlyMarked) {
                logAuditEvent('MARK_MISC_NUM_FOR_DELETION', { record });
                updatedData[index]._isMarkedForDeletion = true;
            } else {
                logAuditEvent('UNDO_DELETE_MISC_NUM', { record });

                // MODIFIED: Delete the property
                delete updatedData[index]._isMarkedForDeletion;

                // Re-run validation
                handleListItemChange('appendedMiscNums', index, 'prefix', updatedData[index].prefix);
            }

            setEditData(updatedData);
        };

        if (isCurrentlyMarked) {
            executeToggleDeletion();
        } else {
            onConfirmDelete(
                "Do you want to mark this Miscellaneous Number for deletion? The change will be permanent when you click Save.",
                executeToggleDeletion
            );
        }
    };

    return (
        <div className="editable-list-container">
            {editData && editData.length > 0 ? (
                editData.map((item, index) => {
                    
                    // --- 1. Get errors (same as before) ---
                    const prefixError = errors?.[`appendedMiscNums[${index}].prefix`];
                    const numberError = errors?.[`appendedMiscNums[${index}].number`];
                    const rowError = prefixError || numberError;

                    return (
                        <div
                            key={item.id || `new-${index}`}
                            // --- 2. ADD THE NEW SCOPED CLASS HERE ---
                            className={`editable-list-item misc-num-list-item ${item._isMarkedForDeletion ? 'marked-for-deletion' : ''}`}
                        >
                            {/* --- 3. WRAPPER FOR ALL FIELDS --- */}
                            <div className="editable-list-item-fields">
                            
                                {/* --- PREFIX FIELD --- */}
                                <div className="detail-item" style={{ flex: '0 0 100px' }}>
                                    <label className="detail-label" htmlFor={`misc-prefix-${index}`}>Prefix:</label>
                                    <input
                                        type="text"
                                        id={`misc-prefix-${index}`}
                                        className="detail-value-edit"
                                        value={item.prefix || ''}
                                        onChange={(e) => handleListItemChange('appendedMiscNums', index, 'prefix', e.target.value)}
                                        placeholder="XXX"
                                        maxLength="3"
                                        aria-label={`Miscellaneous Number Prefix ${index + 1}`}
                                        disabled={item._isMarkedForDeletion}
                                    />
                                    {/* --- Error span removed --- */}
                                </div>

                                {/* --- NUMBER FIELD (class "full-width" is kept) --- */}
                                <div className="detail-item full-width">
                                    <label className="detail-label" htmlFor={`misc-number-${index}`}>Number:</label>
                                    <input
                                        type="text"
                                        id={`misc-number-${index}`}
                                        className="detail-value-edit"
                                        value={item.number || ''}
                                        onChange={(e) => handleListItemChange('appendedMiscNums', index, 'number', e.target.value)}
                                        placeholder="Enter Number"
                                        maxLength="12"
                                        aria-label={`Miscellaneous Number ${index + 1}`}
                                        disabled={item._isMarkedForDeletion}
                                    />
                                    {/* --- Error span removed --- */}
                                </div>

                                {/* --- DELETE BUTTON (Unchanged) --- */}
                                {canDelete && (
                                    <div className="delete-action-cell">
                                        <label className="detail-label">&nbsp;</label>
                                        <button
                                            onClick={() => handleDelete(index, item)}
                                            className={`delete-button ${item._isMarkedForDeletion ? 'undo' : ''}`}
                                            aria-label={item._isMarkedForDeletion ? `Undo deletion for Misc. Number ${index + 1}` : `Mark Misc. Number ${index + 1} for deletion`}
                                            title={item._isMarkedForDeletion ? "Undo Deletion" : "Mark for Deletion"}
                                        >
                                            {item._isMarkedForDeletion ? <UndoIcon /> : <DeleteIcon />}
                                        </button>
                                    </div>
                                )}
                            </div> {/* --- END OF "editable-list-item-fields" WRAPPER --- */}


                            {/* --- 4. ROW ERROR CONTAINER --- */}
                            {/* This is now a direct child of .misc-num-list-item */}
                            {rowError && (
                                <div className="row-error-container">
                                    <span className="field-error-text" role="alert">
                                        {rowError}
                                    </span>
                                </div>
                            )}
                        </div>
                    );
                })
            ) : (
                <p className="no-records-text">No miscellaneous numbers exist for this record.</p>
            )}
            <button onClick={handleAdd} className="add-button">Add New Misc. Number</button>
        </div>
    );
};

export default MiscNumEditSection;