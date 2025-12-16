import { VALID_HAIR_CODES, VALID_EYE_CODES, VALID_SKIN_CODES, VALID_STATE_POB_CODES, VALID_SCAR_MARK_CODES, VALID_MISC_NUM_PREFIXES, VALID_STREET_DIR_CODES, VALID_STREET_SUF_CODES, VALID_RACE_CODES, VALID_SEX_CODES } from '../utils/validationConstants';

// --- HELPER FUNCTIONS ---

/**
 * Auto-formats a string of numbers into MM/DD/YYYY format as the user types.
 */
export const autoFormatDate = (value) => {
    const onlyNums = value.replace(/[^0-9]/g, '');
    if (onlyNums.length <= 2) return onlyNums;
    if (onlyNums.length <= 4) return `${onlyNums.slice(0, 2)}/${onlyNums.slice(2)}`;
    return `${onlyNums.slice(0, 2)}/${onlyNums.slice(2, 4)}/${onlyNums.slice(4, 8)}`;
};

/**
 * Auto-formats a string of numbers into XXX-XX-XXXX format as the user types.
 */
export const autoFormatSsn = (value) => {
    const onlyNums = value.replace(/[^0-9]/g, '');
    if (onlyNums.length <= 3) return onlyNums;
    if (onlyNums.length <= 5) return `${onlyNums.slice(0, 3)}-${onlyNums.slice(3)}`;
    return `${onlyNums.slice(0, 3)}-${onlyNums.slice(3, 5)}-${onlyNums.slice(5, 9)}`;
};

export const isMiscNumRowDuplicate = (currentItem, currentIndex, allItems) => {
    const prefix = (currentItem.prefix || '').trim().toUpperCase();
    const number = (currentItem.number || '').trim().toUpperCase();

    if (!prefix || !number) return false; // Not a full row, so can't be a duplicate

    const firstIndex = allItems.findIndex((item, index) =>
        !item._isMarkedForDeletion &&
        (item.prefix || '').trim().toUpperCase() === prefix &&
        (item.number || '').trim().toUpperCase() === number
    );
    return firstIndex !== -1 && firstIndex !== currentIndex;
};

// --- NEW HELPER FOR REFERENCE ROW DUPLICATE CHECK ---
/**
 * Checks if a reference row is a duplicate of another row in the array.
 * A duplicate is defined as a row where all four key fields match another row.
 * @param {object} currentItem - The reference item being validated.
 * @param {number} currentIndex - The index of the current item.
 * @param {Array<object>} allItems - The full array of reference items.
 * @returns {boolean} True if a duplicate is found, otherwise false.
 */
export const isReferenceRowDuplicate = (currentItem, currentIndex, allItems) => {
    // Find the first item (that is not marked for deletion) that matches all fields of the current item.
    const firstIndex = allItems.findIndex(item =>
        !item._isMarkedForDeletion &&
        item.referenceDate === currentItem.referenceDate &&
        (item.type || '').trim().toUpperCase() === (currentItem.type || '').trim().toUpperCase() &&
        (item.number || '').trim().toUpperCase() === (currentItem.number || '').trim().toUpperCase() &&
        (item.description || '').trim().toUpperCase() === (currentItem.description || '').trim().toUpperCase()
    );

    // If an identical item is found and its index is not the current item's index, it's a duplicate.
    return firstIndex !== -1 && firstIndex !== currentIndex;
};

// --- CENTRAL VALIDATION FUNCTION ---

/**
 * Validates a single field based on its name, value, and the state of all other fields.
 * @param {string} name - The name of the field to validate (e.g., 'fullName', 'dob').
 * @param {string} value - The current value of the field.
 * @param {object} allValues - The current state of all form fields, for cross-field validation.
 * @returns {string|null} An error message string if validation fails, otherwise null.
 */
export const validateField = (name, value, allValues = {}, referenceData = {}, context = {}) => {
    
    const trimmedValue = value ? value.trim() : '';
    const isSearchPage = allValues.hasOwnProperty('typeOfRequest');

    switch (name) {
        case 'fullName':
        case 'name': // Applies to Primary Name AND Aliases
            
            // --- Rule 1: SDX requirement (Search Page) ---
            if (isSearchPage && allValues.typeOfRequest === 'SDX' && !trimmedValue) {
                return "Full Name is required for an SDX search.";
            }

            // --- Rule 2: Blank field checks ---
            if (!trimmedValue) {
                if (isSearchPage) {
                    const { dob, race, sex, sid } = allValues;
                    const otherFieldsHaveValue = !!dob || !!race || !!sex;
                    if (!sid && otherFieldsHaveValue) { 
                        return 'Full Name or SID/FBI/SSN is required when other fields are used.';
                    }
                    return null; 
                } else {
                    return "Name cannot be blank.";
                }
            }
            
            // --- Rule 3: Formatting Rules (Applied to ALL Name fields) ---
            
            // 3a. Check for multiple consecutive spaces
            if (/\s\s/.test(value)) return "Cannot have multiple consecutive spaces.";
            
            // 3b. MANDATORY COMMA CHECK
            // "lastname is only followed by comma" implies comma is required.
            if (!trimmedValue.includes(',')) {
                return "Name must contain a comma (e.g., 'Last Name, First Name' or 'Last Name,').";
            }

            // 3c. ONLY ONE COMMA
            if ((trimmedValue.match(/,/g) || []).length > 1) {
                return "Only one comma is allowed.";
            }

            // 3d. SPACE AFTER COMMA
            // "after comma we have spaces separating other parts"
            // This blocks "Smith,John" but allows "Smith," and "Smith, John"
            if (trimmedValue.includes(',') && /,\S/.test(trimmedValue)) {
                return "Comma must be followed by a space.";
            }

            // 3e. NO SPACE BEFORE COMMA
            // "lastname is only followed by comma"
            if (/ ,/.test(trimmedValue)) {
                return "No space allowed before the comma.";
            }

            // Note: The rule enforcing text *after* the comma has been REMOVED.
            // This allows "SMITH," and "SMITH, " to be valid.

            // --- Rule 4: Duplicate check (Primary Name Edit only) ---
            if (context.isPrimaryName && allValues.aliases) {
                const currentNameUpper = trimmedValue.toUpperCase();
                if (allValues.aliases.some(alias => !alias._isMarkedForDeletion && alias.name && alias.name.toUpperCase() === currentNameUpper)) {
                    return 'This name is already used as an alias.';
                }
            }
            
            return null;

        case 'fbiNumber':
            // Rule 1: SDX Restriction (If currently on Search Page)
            // FRD Requirement: "For SDX search, only Full Name and DOB are allowed."
            if (isSearchPage && allValues.typeOfRequest === 'SDX' && trimmedValue) {
                return "UCN is not allowed for SDX search.";
            }

            // Rule 2: Optional Field Check
            if (!trimmedValue) return null;

            if (!/^[A-Z0-9]+$/i.test(trimmedValue)) {
                return "UCN must be alphanumeric only.";
            }
            return null;

        case 'dlNumber':
            if (!trimmedValue) return null;
            
            // Remove spaces for validation logic
            const cleanDL = trimmedValue.replace(/\s/g, '');

            // Rule: Must START with a Letter (A-Z) or a Hyphen (-)
            
            // 1. Starts with Letter -> Rest can be Alphanumeric (Letters/Numbers)
            // Logic: ^[A-Z] ensures first char is letter. [A-Z0-9]* ensures rest is alphanumeric.
            const validAlphaStart = /^[A-Z][0-9]*$/.test(cleanDL);
            
            // 2. Starts with Hyphen -> Rest must be Numbers
            // Logic: ^- ensures first char is hyphen. [0-9]* ensures rest is digits.
            const validHyphenStart = /^-[0-9]*$/.test(cleanDL);

            // If it doesn't match either pattern, it's invalid
            if (!validAlphaStart && !validHyphenStart) {
                return "DL must start with a letter or hyphen, followed by numbers only.";
            }
            return null;

        case 'dob':
        case 'referenceDate':
            // 1. Mandatory Check
            if (!trimmedValue) {
                if (isSearchPage) {
                    return null; // On Search Page, blank DOB is valid.
                }
                if (name === 'dob') {
                    return "Date of Birth cannot be blank."; // Mandatory on Edit Page.
                }
                if (name === 'referenceDate') {
                    return "Date cannot be blank."; // Mandatory on Edit Page.
                }
            }

            const isSdx = isSearchPage && allValues.typeOfRequest === 'SDX';

            // 2. SDX Special Rule (DOB Only): Allow simple 4-digit Year (YYYY)
            // We check this ONLY if it's the DOB field and SDX mode is active.
            if (name === 'dob' && isSdx && /^\d{4}$/.test(trimmedValue)) {
                const year = parseInt(trimmedValue, 10);
                const currentYear = new Date().getFullYear();
                
                if (year < 1900 || year > currentYear) {
                    return "Invalid Year";
                }
                return null; // Valid YYYY, stop here.
            }

            // 3. Standard Rule: Must be full MM/DD/YYYY
            const fullDateRegex = /^(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/(19|20)\d{2}$/;
            
            if (!fullDateRegex.test(trimmedValue)) {
                return (name === 'dob' && isSdx) 
                    ? "Date must be in MM/DD/YYYY or YYYY format" 
                    : "Date must be in MM/DD/YYYY format.";
            }

            // 4. Logical Date Check (Feb 30th, Future Dates, Years < 1900)
            const [mm, dd, yyyy] = trimmedValue.split('/').map(Number);
            const dateObj = new Date(yyyy, mm - 1, dd);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Check for invalid days (e.g. Feb 31 -> auto-corrected to Mar 3 by JS, so we check equality)
            if (dateObj.getFullYear() !== yyyy || dateObj.getMonth() + 1 !== mm || dateObj.getDate() !== dd) {
                return "Invalid Date";
            }
            if (dateObj >= today) {
                return "Date cannot be today or a future date.";
            }
            if (yyyy < 1900) {
                return "Date too old";
            }
            return null;
        case 'socSec':
        case 'ssn':
            if (!trimmedValue) {
                if (!allValues.hasOwnProperty('typeOfRequest')) {
                    return "SSN cannot be blank.";
                }
                return null; // Blank is OK on search page
            }
            const ssnRegex = /^\d{3}-\d{2}-\d{4}$/;
            if (trimmedValue.length > 0 && trimmedValue.length < 11) return "Incomplete SSN.";
            if (trimmedValue.length === 11 && !ssnRegex.test(trimmedValue)) return "Invalid SSN format.";
            return null;

        case 'pob':
        case 'state':
            if (!trimmedValue) return null; // POB is optional
            if (trimmedValue.length > 0 && !VALID_STATE_POB_CODES.has(trimmedValue.toUpperCase())) {
                return "Invalid code. Please use a valid 2-character state/territory code.";
            }
            return null;

        case 'height':
            if (!trimmedValue) return null;
            if (!/^\d{3}$/.test(trimmedValue)) return "Must be 3 digits (e.g., 506).";
            const feet = parseInt(trimmedValue.substring(0, 1), 10);
            const inches = parseInt(trimmedValue.substring(1, 3), 10);
            if (feet < 2 || feet > 7) return "Feet must be between 2-7.";
            if (inches < 0 || inches > 11) return "Inches must be between 00-11.";
            return null;

        case 'weight':
            if (!trimmedValue) return null;
            const weightNum = parseInt(trimmedValue, 10);
            if (isNaN(weightNum)) return "Weight must be a number.";
            if (weightNum < 40 || weightNum > 499) return "Weight must be between 40-499.";
            return null;

        case 'countryCode':
            if (!trimmedValue) return null; // It's an optional field

            // Check against the list of valid codes passed in via referenceData
            if (referenceData.countryCodes && !referenceData.countryCodes.has(trimmedValue.toUpperCase())) {
                return "Invalid Country Code.";
            }
            return null;

        case 'scarMark':
            if (!trimmedValue) return "Scar/Mark cannot be blank.";
            if (trimmedValue.length > 10) return "Code cannot exceed 10 characters.";
            if (/[^A-Z0-9\s]/i.test(trimmedValue)) return "Code can only contain letters, numbers, and spaces.";
            return null;

        case 'race':
            return VALID_RACE_CODES.has(trimmedValue.toUpperCase()) ? null : "Invalid Race code.";
        
        case 'sex':
            return VALID_SEX_CODES.has(trimmedValue.toUpperCase()) ? null : "Invalid Sex code.";
        
        case 'hair': return VALID_HAIR_CODES.has(trimmedValue.toUpperCase()) ? null : "Invalid Hair code.";
        case 'eyes': return VALID_EYE_CODES.has(trimmedValue.toUpperCase()) ? null : "Invalid Eye code.";
        case 'skin': return VALID_SKIN_CODES.has(trimmedValue.toUpperCase()) ? null : "Invalid Skin code.";

        case 'streetDir':
            if (trimmedValue && !VALID_STREET_DIR_CODES.has(trimmedValue.toUpperCase())) {
                return "Invalid Street Direction code.";
            }
            return null;

        case 'streetSuf':
            if (trimmedValue && !VALID_STREET_SUF_CODES.has(trimmedValue.toUpperCase())) {
                return "Invalid Street Suffix code.";
            }
            return null;

        case 'prefix':
            if (trimmedValue && !VALID_MISC_NUM_PREFIXES.has(trimmedValue.toUpperCase())) {
                return "Invalid Prefix.";
            }
            return null;
        
        case 'type':
        case 'number':
        case 'description':
            if (!trimmedValue) return "This field cannot be blank.";
            return null;

        case 'cautionCode':
            if (!trimmedValue) return "A valid caution must be selected.";
            return null;

        default: return null;
    }
};

/**
 * A utility function to run validation across a targeted set of fields in a data object,
 * including nested arrays. THIS IS THE FINAL, COMPLETE VERSION.
 *
 * @param {object} data - The data object to validate.
 * @param {Array<string>} [fieldsToValidate] - An array of field names/keys to validate.
 * If a key is an array name (e.g., 'aliases'),
 * it will validate the items within that array.
 * @returns {object} An errors object where keys correspond to field names.
 */
export const validateAll = (data, fieldsToValidate, referenceData = {}, context = {}) => {
    const errors = {};
    if (!data || !fieldsToValidate) return errors;

    fieldsToValidate.forEach(key => {
        // --- 1. Handle Top-Level Simple Fields ---
        if (!['aliases', 'appendedCautions', 'appendedDobs', 'appendedScarsMarks', 'appendedSsns', 'appendedMiscNums', 'references'].includes(key)) {
            const error = validateField(key, data[key], data, referenceData, context);
            if (error) {
                errors[key] = error;
            }
        }

        // --- 2. Handle Nested Array Validations ---
        if (key === 'aliases' && data.aliases) {
            data.aliases.forEach((item, index) => {
                const error = validateListItem('name', item.name, index, data.aliases);
                if (error) { errors[`aliases[${index}].name`] = error; }
            });
        }
        if (key === 'appendedCautions' && data.appendedCautions) {
            data.appendedCautions.forEach((item, index) => {
                const error = validateListItem('cautionCode', item.cautionCode, index, data.appendedCautions);
                if (error) { errors[`appendedCautions[${index}].cautionCode`] = error; }
            });
        }
        if (key === 'appendedDobs' && data.appendedDobs) {
            data.appendedDobs.forEach((item, index) => {
                const error = validateListItem('dob', item.dob, index, data.appendedDobs);
                if (error) { errors[`appendedDobs[${index}].dob`] = error; }
            });
        }

        if (key === 'appendedSsns' && data.appendedSsns) {
            data.appendedSsns.forEach((item, index) => {
                const ssnValue = (item.socSec || '').trim();
                if (!ssnValue) {
                    errors[`appendedSsns[${index}].socSec`] = "SSN cannot be blank.";
                    return; // Stop processing this item
                }
                const error = validateListItem('ssn', item.socSec, index, data.appendedSsns);
                if (error) { errors[`appendedSsns[${index}].socSec`] = error; }
            });
        }
        if (key === 'appendedMiscNums' && data.appendedMiscNums) {
            data.appendedMiscNums.forEach((item, index) => {
                if (item._isMarkedForDeletion) return;

                // Call the new centralized function
                const { prefixError, numberError } = validateMiscNumRow(item, index, data.appendedMiscNums);

                // Assign errors if they exist
                if (prefixError) {
                    errors[`appendedMiscNums[${index}].prefix`] = prefixError;
                }
                if (numberError) {
                    errors[`appendedMiscNums[${index}].number`] = numberError;
                }
            });
        }
         // UPDATED: The 'references' validation now checks all four fields.
        if (key === 'references' && data.references) {
            data.references.forEach((item, index) => {
                // Ignore validation for rows marked for deletion
                if (item._isMarkedForDeletion) return;
                
                // 1. Validate all individual fields to ensure they are not blank
                const dateError = validateField('referenceDate', item.referenceDate);
                if (dateError) errors[`references[${index}].referenceDate`] = dateError;

                const typeError = validateField('type', item.type);
                if (typeError) errors[`references[${index}].type`] = typeError;

                const numberError = validateField('number', item.number);
                if (numberError) errors[`references[${index}].number`] = numberError;

                const descriptionError = validateField('description', item.description);
                if (descriptionError) errors[`references[${index}].description`] = descriptionError;

                // 2. Perform the whole-row duplicate check (only if all fields have a value)
                if (item.referenceDate && item.type && item.number && item.description) {
                    if (isReferenceRowDuplicate(item, index, data.references)) {
                        const duplicateError = "This is an exact duplicate of another row.";
                        // Attach error to the first field
                        errors[`references[${index}].referenceDate`] = errors[`references[${index}].referenceDate`]
                            ? `${errors[`references[${index}].referenceDate`]} ${duplicateError}`
                            : duplicateError;
                    }
                }
            });
        }

        if (key === 'appendedScarsMarks' && data.appendedScarsMarks) {
            data.appendedScarsMarks.forEach((item, index) => {
                const scarMarkValue = item.scarMark ? item.scarMark.trim().toUpperCase() : '';
                let errorMessage = '';

                // 1. Check if the field is blank.
                if (!scarMarkValue) {
                    errors[`appendedScarsMarks[${index}].scarMark`] = "Scar/Mark cannot be blank.";
                    return; // Stop processing this item
                }

                // 2. Check for duplicates within the list being edited.
                // We do this check here on save, not in real-time.
                if (scarMarkValue) {
                    const firstIndex = data.appendedScarsMarks.findIndex((innerItem, innerIndex) =>
                        !innerItem._isMarkedForDeletion &&
                        innerItem.scarMark &&
                        innerItem.scarMark.trim().toUpperCase() === scarMarkValue
                    );
                    if (firstIndex !== -1 && firstIndex !== index) {
                        errorMessage = "Duplicate value detected.";
                    }
                }

                // 2. Perform the strict check against the SMT Table codes.
                if (scarMarkValue && !VALID_SCAR_MARK_CODES.has(scarMarkValue)) {
                    const invalidCodeError = "Invalid Scar/Mark code.";
                    errorMessage = errorMessage ? `${errorMessage} ${invalidCodeError}` : invalidCodeError;
                }

                if (errorMessage) {
                    errors[`appendedScarsMarks[${index}].scarMark`] = errorMessage;
                }
            });
        }
    });

    return errors;
};

/**
 * Validates a single field within a list of items.
 * @param {string} fieldName - The name of the field to check.
 * @param {any} value - The current value of the field.
 * @param {number} index - The index of the current item in the array.
 * @param {Array<object>} array - The entire array of items being edited.
 * @param {object} allValues - The entire form data object for cross-section validation.
 * @returns {string|null} An error message if validation fails, otherwise null.
 */
export const validateListItem = (fieldName, value, index, array, allValues = {}) => {
    // 1. First, run standard field validation. This is called without the 'isPrimaryName' context,
    // so it correctly skips the "check against aliases" part that caused the bug.
    const fieldError = validateField(fieldName, value, allValues);
    if (fieldError) return fieldError;

    // 2. If validating an alias name, check it against the primary name.
    if (fieldName === 'name') {
        const valueToCheck = (value || '').trim().toUpperCase();
        const primaryName = (allValues.name || '').trim().toUpperCase();
        if (valueToCheck && valueToCheck === primaryName) {
            // This returns your desired error message for this specific rule.
            return 'An alias cannot be the same as the primary name.';
        }
    }
    
    // 3. Then run the original duplicate check within the current list (e.g., alias vs. other aliases).
    if (!value) return null;
    const trimmedValue = value.trim().toUpperCase();
    if (!trimmedValue) return null;

    const firstIndex = array.findIndex((item, innerIndex) => 
        !item._isMarkedForDeletion &&
        index !== innerIndex && // <-- This line is now correct
        item[fieldName] && 
        item[fieldName].trim().toUpperCase() === trimmedValue
    );

    if (firstIndex !== -1 && firstIndex !== index) {
        return "Duplicate value detected.";
    }

    return null;
};

/**
 * Validates a single miscellaneous number row.
 * Checks for required fields, prefix validity, and duplicates.
 * @param {object} item - The misc num item { prefix, number }
 * @param {number} index - The index of the item in the array
 * @param {Array<object>} allItems - The full array of misc num items
 * @returns {object} - An object with { prefixError, numberError }
 */
export const validateMiscNumRow = (item, index, allItems) => {
    const prefix = (item.prefix || '').trim();
    const number = (item.number || '').trim();
    let prefixError = null;
    let numberError = null;

    // --- Rule: Check for Required Fields ---
    if ((!prefix && !number) || (prefix && !number) || (!prefix && number)) {
        // This covers "both blank" and "one blank" cases
        numberError = "Both prefix and number are required.";
    }

    // Rule: If a prefix is entered, it must be valid.
    if (prefix && !VALID_MISC_NUM_PREFIXES.has(prefix.toUpperCase())) {
        prefixError = "Invalid Prefix.";
    }

    // Rule: The combination must not be a duplicate.
    if (prefix && number && isMiscNumRowDuplicate(item, index, allItems)) {
        // If there's already a "required" error, don't stack "duplicate"
        if (!numberError) {
            numberError = "This is a duplicate of another row.";
        }
    }

    return { prefixError, numberError };
};