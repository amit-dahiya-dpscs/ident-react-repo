import React from 'react';
import { useReferenceData } from '../../context/ReferenceDataContext';
import { logAuditEvent } from '../../services/auditService';

// Reusable SVG icon for the "Delete" button
const DeleteIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        <line x1="10" y1="11" x2="10" y2="17" />
        <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
);

/**
 * A dedicated component for rendering the editable form for the "Append-ID" section.
 */
const AppendIdEditSection = ({ editData, setEditData, canDelete }) => {
    const { cautionCodes } = useReferenceData(); // Get caution codes for the dropdown

    /**
     * Handles changes to any input field within a specific record row.
     */
    const handleChange = (index, fieldName, value) => {
        const updatedData = [...editData];
        updatedData[index][fieldName] = value;
        setEditData(updatedData);
    };

    /**
     * Adds a new, blank Appended-ID object to the end of the editData array.
     */
    const handleAdd = () => {
        logAuditEvent('ADD_APPEND_ID_CLICK');
        setEditData([...editData, {
            id: null,
            caution: '',
            dob: '',
            scarsMarks: '',
            socSec: '',
            miscNumber: ''
        }]);
    };

    /**
     * Removes an Appended-ID record from the editData array at a specific index.
     */
    const handleDelete = (index, record) => {
        if (window.confirm("Do you want to delete this appended ID record?")) {
            logAuditEvent('DELETE_APPEND_ID_CLICK', { record });
            setEditData(editData.filter((_, i) => i !== index));
        }
    };

    return (
        <div className="editable-table-container">
            {/* Table Header */}
            <div className="editable-record-row appended-id-grid header-row">
                <span className="detail-label">Caution:</span>
                <span className="detail-label">DOB:</span>
                <span className="detail-label">Scars/Marks:</span>
                <span className="detail-label">Soc-Sec:</span>
                <span className="detail-label">Misc-Number:</span>
                {canDelete && <div />}
            </div>

            {editData.length > 0 ? (
                editData.map((record, index) => (
                    <div key={record.id || `new-${index}`} className="editable-record-row appended-id-grid">
                        <div className="detail-item">
                            <select
                                className="detail-value-edit"
                                value={record.caution || ''}
                                onChange={(e) => handleChange(index, 'caution', e.target.value)}
                                aria-label={`Caution for row ${index + 1}`}
                            >
                                <option value="">-- Select Caution --</option>
                                {Object.entries(cautionCodes).map(([code, description]) => (
                                    <option key={code} value={code}>{description}</option>
                                ))}
                            </select>
                        </div>
                        <div className="detail-item">
                            <input
                                type="text"
                                className="detail-value-edit"
                                name={`appendedIds[${index}].dob`}
                                value={record.dob || ''}
                                onChange={handleChange}
                                placeholder="MM/DD/YYYY"
                                maxLength="10"
                                aria-label={`Date of Birth for row ${index + 1}`}
                            />
                            {errors[`appendedIds[${index}].dob`] && <span className="field-error-text">{errors[`appendedIds[${index}].dob`]}</span>}
                        </div>
                        <div className="detail-item">
                            <input
                                type="text"
                                className="detail-value-edit"
                                value={record.scarsMarks || ''}
                                onChange={(e) => handleChange(index, 'scarsMarks', e.target.value)}
                                aria-label={`Scars/Marks for row ${index + 1}`}
                            />
                        </div>
                        <div className="detail-item">
                            <input
                                type="text"
                                className="detail-value-edit"
                                value={record.socSec || ''}
                                onChange={(e) => handleChange(index, 'socSec', e.target.value)}
                                aria-label={`Social Security for row ${index + 1}`}
                            />
                        </div>
                        <div className="detail-item">
                            <input
                                type="text"
                                className="detail-value-edit"
                                value={record.miscNumber || ''}
                                onChange={(e) => handleChange(index, 'miscNumber', e.target.value)}
                                aria-label={`Miscellaneous Number for row ${index + 1}`}
                            />
                        </div>
                        {canDelete && (
                            <div className="delete-action-cell">
                                <button
                                    onClick={() => handleDelete(index, record)}
                                    className="delete-button"
                                    aria-label={`Delete appended ID row ${index + 1}`}
                                    title="Delete Record"
                                >
                                    <DeleteIcon />
                                </button>
                            </div>
                        )}
                    </div>
                ))
            ) : (
                <p className="no-records-text">No appended identifiers exist for this record.</p>
            )}
            <button onClick={handleAdd} className="add-button">Add New Appended ID</button>
        </div>
    );
};

export default AppendIdEditSection;