import React from 'react';
import { logAuditEvent } from '../../services/auditService';
import { DeleteIcon, UndoIcon } from './EditIcons.js';

/**
 * A dedicated component for rendering the editable form for the "Alias-Name" section.
 * It handles adding, modifying, and deleting aliases within the edit session.
 *
 * @param {Array} editData - The array of alias objects being edited.
 * @param {function} setEditData - The function to update the alias array state in the parent.
 * @param {boolean} canDelete - A flag based on user roles to determine if the "Delete" button should be shown.
 */
const AliasEditSection = ({ editData, handleListItemChange, setEditData, canDelete, errors, onConfirmDelete }) => {

    const handleAdd = () => {
        logAuditEvent('ADD_ALIAS_CLICK');
        setEditData([...editData, { id: null, name: '' }]);
    };

    const handleDelete = (index, alias) => {
        // If the alias is new (has no ID) and the name field is empty, remove it directly.
        const isNew = alias.id === null;
        const isEmpty = !alias.name || !alias.name.trim();

        if (isNew && isEmpty) {
            logAuditEvent('DELETE_NEW_EMPTY_ALIAS');
            // Filter the array to remove this item and stop further execution.
            setEditData(editData.filter((_, i) => i !== index));
            return;
        }

        const isCurrentlyMarked = !!alias._isMarkedForDeletion;

        // This is the function that will run after confirmation
        const executeToggleDeletion = () => {
            const updatedAliases = [...editData]; // Get a copy of the array

            if (!isCurrentlyMarked) {
                // We are MARKING FOR DELETION
                logAuditEvent('MARK_ALIAS_FOR_DELETION', { alias });
                updatedAliases[index]._isMarkedForDeletion = true;
            } else {
                // We are UNDOING DELETION
                logAuditEvent('UNDO_DELETE_ALIAS', { alias });
                
                // MODIFIED: Instead of setting to false, delete the property
                delete updatedAliases[index]._isMarkedForDeletion;

                // Re-run validation on undo
                handleListItemChange('aliases', index, 'name', updatedAliases[index].name);
            }
            
            setEditData(updatedAliases);
        };
        
        // If we are UNDOING a delete, no confirmation is needed.
        if (isCurrentlyMarked) {
            executeToggleDeletion();
        } else {
            // If we are MARKING FOR DELETION, call the parent to show the confirmation modal.
            onConfirmDelete(
                "Do you want to mark this alias for deletion? The change will be permanent when you click Save.",
                executeToggleDeletion // Pass the function to run if "Yes" is clicked
            );
        }
    };

    return (
        <div className="editable-list-container">
            {editData.length > 0 ? (
                editData.map((alias, index) => (
                    <div
                        key={alias.id || `new-${index}`}
                        className={`editable-list-item ${alias._isMarkedForDeletion ? 'marked-for-deletion' : ''}`}
                    >
                        <div className="detail-item full-width">
                            <input
                                type="text"
                                className="detail-value-edit"
                                value={alias.name}
                                // UPDATED: Use the handler from props
                                onChange={(e) => handleListItemChange('aliases', index, 'name', e.target.value)}
                                placeholder="Last Name, First Name"
                                aria-label={`Alias name ${index + 1}`}
                                disabled={alias._isMarkedForDeletion}
                            />
                            {/* The error key remains the same and will now work correctly */}
                            {errors[`aliases[${index}].name`] && <span className="field-error-text">{errors[`aliases[${index}].name`]}</span>}
                        </div>
                        {canDelete && (
                            <button
                                onClick={() => handleDelete(index, alias)}
                                className={`delete-button ${alias._isMarkedForDeletion ? 'undo' : ''}`}
                                aria-label={alias._isMarkedForDeletion ? `Undo deletion for alias ${index + 1}` : `Mark alias ${index + 1} for deletion`}
                                title={alias._isMarkedForDeletion ? "Undo Deletion" : "Mark for Deletion"}
                            >
                                {alias._isMarkedForDeletion ? <UndoIcon /> : <DeleteIcon />}
                            </button>
                        )}
                    </div>
                ))
            ) : (
                <p className="no-records-text">No aliases exist for this record.</p>
            )}
            <button onClick={handleAdd} className="add-button">Add New Alias</button>
        </div>
    );
};

export default AliasEditSection;