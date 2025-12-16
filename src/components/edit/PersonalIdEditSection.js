import React from 'react';

const raceOptions = [
    { code: 'A', description: 'Asian or Pacific Islander' },
    { code: 'B', description: 'Black' },
    { code: 'I', description: 'American Indian or Alaskan Native' },
    { code: 'U', description: 'Unknown' },
    { code: 'W', description: 'White' },
];

const sexOptions = [
    { code: 'F', description: 'Female' },
    { code: 'G', description: 'Female (Female Print, Male Reference)' },
    { code: 'M', description: 'Male' },
    { code: 'N', description: 'Male (Male Print, Female Reference)' },
    { code: 'X', description: 'Unknown' },
    { code: 'Y', description: 'Male (Male, Unreported)' },
    { code: 'Z', description: 'Female (Female, Unreported)' },
];

const eyeOptions = [
    { code: 'BLK', description: 'Black' },
    { code: 'BLU', description: 'Blue' },
    { code: 'BRO', description: 'Brown' },
    { code: 'GRY', description: 'Gray' },
    { code: 'GRN', description: 'Green' },
    { code: 'HAZ', description: 'Hazel' },
    { code: 'MAR', description: 'Maroon' },
    { code: 'PNK', description: 'Pink' },
    { code: 'XXX', description: 'Unknown' }
];

const hairOptions = [
    { code: 'BLD', description: 'Bald' },
    { code: 'BLK', description: 'Black' },
    { code: 'BLN', description: 'Blonde / Strawberry' },
    { code: 'BLU', description: 'Blue' },
    { code: 'BRO', description: 'Brown' },
    { code: 'GRN', description: 'Green' },
    { code: 'GRY', description: 'Gray / Partially Gray' },
    { code: 'ONG', description: 'Orange' },
    { code: 'PLE', description: 'Purple' },
    { code: 'PNK', description: 'Pink' },
    { code: 'RED', description: 'Red / Auburn' },
    { code: 'SDY', description: 'Sandy' },
    { code: 'WHI', description: 'White' },
    { code: 'XXX', description: 'Unknown' },
];

const skinOptions = [
    { code: 'ALB', description: 'Albino' },
    { code: 'BLK', description: 'Black' },
    { code: 'DBR', description: 'Dark Brown' },
    { code: 'DRK', description: 'Dark' },
    { code: 'FAR', description: 'Fair' },
    { code: 'LBR', description: 'Light Brown' },
    { code: 'LGT', description: 'Light' },
    { code: 'MBR', description: 'Medium Brown' },
    { code: 'MED', description: 'Medium' },
    { code: 'OLV', description: 'Olive' },
    { code: 'RUD', description: 'Ruddy' },
    { code: 'SAL', description: 'Sallow' },
    { code: 'YEL', description: 'Yellow' },
];


/**
 * A dedicated component for rendering the editable form for the "Personal Identifiers" section.
 * It receives its state and handlers as props from the parent DetailsView.
 *
 * @param {object} editData - The current state of the data being edited.
 * @param {function} handleChange - The function from the parent hook to update state and trigger validation.
 * @param {object} errors - The validation errors object from the parent hook.
 */
const PersonalIdEditSection = ({ editData, handleChange, errors, cautionCodes }) => {

    // If the edit data hasn't been initialized yet, don't render the form.
    if (!editData) {
        return null;
    }

    return (
        <div>
            {/* --- DEMOGRAPHICS SUB-SECTION --- */}
            <div className="details-grid personal-identifiers-grid">
                {/* --- RACE DROPDOWN --- */}
                <div className="detail-item">
                    <label className="detail-label" htmlFor="race-edit">Race:</label>
                    <select id="race-edit" name="race" className="detail-value-edit" value={editData.race || ''} onChange={handleChange}>
                        <option value="">-- Select --</option>
                        {raceOptions.map(opt => <option key={opt.code} value={opt.code}>{`${opt.code} - ${opt.description}`}</option>)}
                    </select>
                    {errors.race && <span className="field-error-text" role="alert">{errors.race}</span>}
                </div>
                {/* --- SEX DROPDOWN --- */}
                <div className="detail-item">
                    <label className="detail-label" htmlFor="sex-edit">Sex:</label>
                    <select id="sex-edit" name="sex" className="detail-value-edit" value={editData.sex || ''} onChange={handleChange}>
                        <option value="">-- Select --</option>
                        {sexOptions.map(opt => <option key={opt.code} value={opt.code}>{`${opt.code} - ${opt.description}`}</option>)}
                    </select>
                    {errors.sex && <span className="field-error-text" role="alert">{errors.sex}</span>}
                </div>
                <div className="detail-item">
                    <label className="detail-label" htmlFor="dob-edit">DOB:</label>
                    <input id="dob-edit" type="text" name="dob" className="detail-value-edit" value={editData.dob || ''} onChange={handleChange} placeholder="MM/DD/YYYY" maxLength="10" />
                    {errors.dob && <span className="field-error-text" role="alert">{errors.dob}</span>}
                </div>
                <div className="detail-item">
                    <label className="detail-label" htmlFor="pob-edit">POB:</label>
                    <input id="pob-edit" type="text" name="pob" className="detail-value-edit" value={editData.pob || ''} onChange={handleChange} maxLength="2" />
                    {errors.pob && <span className="field-error-text">{errors.pob}</span>}
                </div>
                <div className="detail-item">
                    <label className="detail-label" htmlFor="hgt-edit">HGT:</label>
                    <input id="hgt-edit" type="text" name="height" className="detail-value-edit" value={editData.height || ''} onChange={handleChange} maxLength="3" />
                    {errors.height && <span className="field-error-text" role="alert">{errors.height}</span>}
                </div>
                <div className="detail-item">
                    <label className="detail-label" htmlFor="wgt-edit">WGT:</label>
                    <input id="wgt-edit" type="text" name="weight" className="detail-value-edit" value={editData.weight || ''} onChange={handleChange} maxLength="3" />
                    {errors.weight && <span className="field-error-text" role="alert">{errors.weight}</span>}
                </div>
                {/* --- EYES DROPDOWN --- */}
                <div className="detail-item">
                    <label className="detail-label" htmlFor="eyes-edit">Eyes:</label>
                    <select id="eyes-edit" name="eyes" className="detail-value-edit" value={editData.eyes || ''} onChange={handleChange}>
                        <option value="">-- Select --</option>
                        {eyeOptions.map(opt => <option key={opt.code} value={opt.code}>{`${opt.code} - ${opt.description}`}</option>)}
                    </select>
                    {errors.eyes && <span className="field-error-text" role="alert">{errors.eyes}</span>}
                </div>
                {/* --- HAIR DROPDOWN --- */}
                <div className="detail-item">
                    <label className="detail-label" htmlFor="hair-edit">Hair:</label>
                    <select id="hair-edit" name="hair" className="detail-value-edit" value={editData.hair || ''} onChange={handleChange}>
                        <option value="">-- Select --</option>
                        {hairOptions.map(opt => <option key={opt.code} value={opt.code}>{`${opt.code} - ${opt.description}`}</option>)}
                    </select>
                    {errors.hair && <span className="field-error-text" role="alert">{errors.hair}</span>}
                </div>
                {/* --- SKIN DROPDOWN --- */}
                <div className="detail-item">
                    <label className="detail-label" htmlFor="skin-edit">Skin:</label>
                    <select id="skin-edit" name="skin" className="detail-value-edit" value={editData.skin || ''} onChange={handleChange}>
                        <option value="">-- Select --</option>
                        {skinOptions.map(opt => <option key={opt.code} value={opt.code}>{`${opt.code} - ${opt.description}`}</option>)}
                    </select>
                    {errors.skin && <span className="field-error-text" role="alert">{errors.skin}</span>}
                </div>

                {/* --- CAUTION INDICATOR FIELD --- */}
                <div className="detail-item span-two-columns">
                    <label className="detail-label" htmlFor="cautionInd-edit">Caution Indicator:</label>
                    <select 
                        id="cautionInd-edit" 
                        name="cautionInd" 
                        className="detail-value-edit" 
                        value={editData.cautionInd || ''} 
                        onChange={handleChange}
                    >
                        <option value="">-- Select --</option>
                        {/* Map over the cautionCodes object passed from parent */}
                        {cautionCodes && Object.entries(cautionCodes).map(([code, description]) => (
                            <option key={code} value={code}>
                                {`${code} - ${description}`}
                            </option>
                        ))}
                    </select>
                    {/* You might want to add validation for this in useValidation.js if needed */}
                </div>
            </div>

            {/* --- ADDRESS SUB-SECTION --- */}
            <h4 className="sub-section-title">ADDRESS</h4>
            <div className="details-grid address-grid">
                <div className="detail-item">
                    <label className="detail-label" htmlFor="streetNumber-edit">Street Number:</label>
                    <input id="streetNumber-edit" type="text" name="streetNumber" className="detail-value-edit" value={editData.streetNumber || ''} onChange={handleChange} />
                </div>
                <div className="detail-item">
                    <label className="detail-label" htmlFor="streetDir-edit">Street Dir:</label>
                    <input id="streetDir-edit" type="text" name="streetDir" className="detail-value-edit" value={editData.streetDir || ''} onChange={handleChange} maxLength="2" />
                    {errors.streetDir && <span className="field-error-text" role="alert">{errors.streetDir}</span>}
                </div>
                <div className="detail-item">
                    <label className="detail-label" htmlFor="streetName-edit">Street Name:</label>
                    <input id="streetName-edit" type="text" name="streetName" className="detail-value-edit" value={editData.streetName || ''} onChange={handleChange} />
                </div>
                <div className="detail-item">
                    <label className="detail-label" htmlFor="streetSuf-edit">Suf:</label>
                    <input id="streetSuf-edit" type="text" name="streetSuf" className="detail-value-edit" value={editData.streetSuf || ''} onChange={handleChange} maxLength="2" />
                     {errors.streetSuf && <span className="field-error-text" role="alert">{errors.streetSuf}</span>}
                </div>
            </div>
            <div className="details-grid city-state-zip-grid">
                <div className="detail-item">
                    <label className="detail-label" htmlFor="city-edit">City:</label>
                    <input id="city-edit" type="text" name="city" className="detail-value-edit" value={editData.city || ''} onChange={handleChange} />
                </div>
                <div className="detail-item">
                    <label className="detail-label" htmlFor="state-edit">State:</label>
                    <input id="state-edit" type="text" name="state" className="detail-value-edit" value={editData.state || ''} onChange={handleChange} maxLength="2" />
                    {errors.state && <span className="field-error-text">{errors.state}</span>}
                </div>
                <div className="detail-item">
                    <label className="detail-label" htmlFor="zip-edit">Zip:</label>
                    <input id="zip-edit" type="text" name="zip" className="detail-value-edit" value={editData.zip || ''} onChange={handleChange} maxLength="5" />
                </div>
                <div className="detail-item">
                    <label className="detail-label" htmlFor="countryCode-edit">COUNTRY OF CITIZENSHIP:</label>

                    {/* This new wrapper creates the horizontal layout */}
                    <div className="country-input-group">
                        <input
                            id="countryCode-edit"
                            name="countryCode"
                            type="text"
                            className="detail-value-edit country-code-input" /* Added new class */
                            value={editData.countryCode || ''}
                            onChange={handleChange}
                            maxLength="2"
                            placeholder="Code"
                        />
                        <span className="detail-value read-only-in-edit country-name-display"> {/* Added new class */}
                            {editData.country || 'NOT REPORTED'}
                        </span>
                    </div>

                    {errors.countryCode && <span className="field-error-text" role="alert">{errors.countryCode}</span>}
                </div>
            </div>

            {/* --- COMMENT SUB-SECTION --- */}
            <h4 className="sub-section-title">COMMENT</h4>
            <textarea
                className="comment-textarea-edit"
                name="comment"
                value={editData.comment || ''}
                onChange={handleChange}
                rows="3"
            />
        </div>
    );
};

export default PersonalIdEditSection;