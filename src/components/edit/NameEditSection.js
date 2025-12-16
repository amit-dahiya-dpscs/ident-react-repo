import React from 'react';

/**
 * A dedicated component for rendering the editable form for the "Name" section.
 */
const NameEditSection = ({ editData, handleChange, errors }) => {

    if (!editData) {
        return null;
    }

    return (
        <div className="details-grid top-section-grid">
            {/* --- NAME INPUT --- */}
            <div className="detail-item-name">
                <label className="detail-label" htmlFor="name-edit">Name:</label>
                <input
                    id="name-edit"
                    type="text"
                    name="name"
                    className="detail-value-edit"
                    value={editData.name || ''}
                    onChange={handleChange}
                    autoFocus
                />
                {errors.name && <span className="field-error-text" role="alert">{errors.name}</span>}
            </div>

            {/* --- SID (READ-ONLY) --- */}
            <div className="detail-item-sid">
                <div className="detail-item">
                    <span className="detail-label">SID:</span>
                    <span className="detail-value read-only-in-edit">{editData.sid}</span>
                </div>
            </div>

            {/* --- RECORD TYPE (READ-ONLY) --- */}
            {/* CORRECTED: This now has a proper label and structure like the SID field. */}
            <div className="detail-item-record-type">
                <div className="detail-item">
                    <span className="detail-label">Record Type:</span>
                    <span className="detail-value read-only-in-edit">{editData.recordTypeDisplay}</span>
                </div>
            </div>
        </div>
    );
};

export default NameEditSection;