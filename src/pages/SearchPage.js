import React, { useState, useEffect, useCallback, useMemo } from 'react';
import dpscsLogo from '../assets/maryland_seal.png';
import { searchIdentRecords, getIdentDetail } from '../services/api'; // Updated API imports
import DetailsView from '../components/DetailsView';
import SearchResultsTable from '../components/SearchResultsTable';
import { useAuth } from '../context/AuthContext';
import { logAuditEvent } from '../services/auditService';
import './SearchPage.css';
import { validateField, autoFormatSsn } from '../hooks/useValidation';

const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
);

// Updated Initial State with FBI Number
const initialState = {
    typeOfRequest: '',
    fullName: '',
    dob: '',
    sid: '',
    fbiNumber: '',
    ssn: '',
    dlNumber: '',
    race: '',
    sex: ''
};

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

const SearchPage = () => {
    const { logout, user } = useAuth();
    const [searchCriteria, setSearchCriteria] = useState(initialState);
    const [errors, setErrors] = useState({});
    const [searchResult, setSearchResult] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isDropdownVisible, setIsDropdownVisible] = useState(false);

    const [notification, setNotification] = useState({ message: '', type: '' });
    const [displayResults, setDisplayResults] = useState([]);

    // Derived state for SDX Logic
    const isSdxMode = searchCriteria.typeOfRequest === 'SDX';

    useEffect(() => {
        if (searchResult && searchResult.data) {
            setDisplayResults(searchResult.data);
        }
    }, [searchResult]);

    useEffect(() => {
        const successMessage = sessionStorage.getItem('expungementSuccessMessage');
        if (successMessage) {
            setNotification({ message: successMessage, type: 'success' });
            sessionStorage.removeItem('expungementSuccessMessage');
        }
    }, []);

    useEffect(() => {
        if (notification.message) {
            const timer = setTimeout(() => {
                setNotification({ message: '', type: '' });
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    const handleChange = useCallback((e) => {
        const { name, value } = e.target;
        let finalValue = value;

        // Apply auto-formatting based on the field name
        switch (name) {
            case 'fullName':
                // Standardize Name Input
                finalValue = value.replace(/[^a-zA-Z\s,'-]/g, '');
                break;
            case 'sid':
                finalValue = value.replace(/[^0-9]/g, '');
                break;
            case 'fbiNumber':
                finalValue = value.toUpperCase();
                break;
            case 'dob':
                // 1. Get raw digits only
                const rawDate = value.replace(/\D/g, '');
                
                // 2. Check if we are in SDX mode
                const isSdx = searchCriteria.typeOfRequest === 'SDX';

                if (isSdx) {
                    // --- SDX MODE: Allow YYYY OR MM/DD/YYYY ---
                    
                    // Logic: If starts with 13-99, assume it's a Year (YYYY).
                    // (Months only go up to 12).
                    if (rawDate.length >= 2) {
                        const firstTwo = parseInt(rawDate.substring(0, 2), 10);
                        
                        if (firstTwo > 12) {
                            // It's a Year (e.g. 19.., 20..) -> Limit to 4 chars
                            finalValue = rawDate.slice(0, 4); 
                        } else {
                            // It's a Month (01-12) -> Format as MM/DD/YYYY
                            if (rawDate.length <= 2) finalValue = rawDate;
                            else if (rawDate.length <= 4) finalValue = `${rawDate.slice(0, 2)}/${rawDate.slice(2)}`;
                            else finalValue = `${rawDate.slice(0, 2)}/${rawDate.slice(2, 4)}/${rawDate.slice(4, 8)}`;
                        }
                    } else {
                        finalValue = rawDate;
                    }
                } else {
                    // --- REGULAR MODE: Enforce MM/DD/YYYY ---
                    if (rawDate.length <= 2) finalValue = rawDate;
                    else if (rawDate.length <= 4) finalValue = `${rawDate.slice(0, 2)}/${rawDate.slice(2)}`;
                    else finalValue = `${rawDate.slice(0, 2)}/${rawDate.slice(2, 4)}/${rawDate.slice(4, 8)}`;
                }
                break;
            case 'ssn':
                finalValue = autoFormatSsn(value);
                break;
            case 'dlNumber':
                finalValue = value.toUpperCase();
                break;
            default: break;
        }

        const newSearchCriteria = { ...searchCriteria, [name]: finalValue };

        // SDX LOGIC: If switching TO SDX, clear ID fields that are not allowed
        if (name === 'typeOfRequest' && finalValue === 'SDX') {
            newSearchCriteria.sid = '';
            newSearchCriteria.fbiNumber = '';
            newSearchCriteria.ssn = '';
            newSearchCriteria.race = '';
            newSearchCriteria.sex = '';
            newSearchCriteria.dlNumber = '';
        }
        // Standard Logic: If switching FROM SDX, clear DOB if it's just YYYY
        if (name === 'typeOfRequest' && finalValue !== 'SDX' && searchCriteria.dob.length === 4) {
            newSearchCriteria.dob = '';
        }

        setSearchCriteria(newSearchCriteria);

        setErrors(prevErrors => {
            const newErrors = { ...prevErrors };

            // Validate the field that just changed
            newErrors[name] = validateField(name, finalValue, newSearchCriteria);

            // Cross-field validation
            if (name === 'typeOfRequest') {
                newErrors.fullName = validateField('fullName', newSearchCriteria.fullName, newSearchCriteria);
                newErrors.dob = validateField('dob', newSearchCriteria.dob, newSearchCriteria);
            }

            return newErrors;
        });

    }, [searchCriteria]);

    const resetForm = useCallback(() => {
        setSearchCriteria(initialState);
        setErrors({});
        setSearchResult(null);
    }, []);

    const hasErrors = useMemo(() => Object.values(errors).some(error => error !== null), [errors]);

    // Enable Search Button Logic
    const isSearchEnabled = useMemo(() => {
        if (hasErrors) return false;
        // SDX requires Name
        if (isSdxMode) return !!searchCriteria.fullName;
        // Standard requires Name OR any ID
        return !!searchCriteria.fullName || !!searchCriteria.sid || !!searchCriteria.fbiNumber || !!searchCriteria.ssn ||
            !!searchCriteria.dlNumber;
    }, [hasErrors, isSdxMode, searchCriteria]);

    const isFormEmpty = !Object.values(searchCriteria).some(val => val !== '');

    // Dropdown close logic
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isDropdownVisible) {
                setIsDropdownVisible(false);
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isDropdownVisible]);

    const handleClear = () => {
        logAuditEvent('CLEAR_CLICK', { formBeforeClear: searchCriteria });
        resetForm();
        setNotification({ message: '', type: '' });
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        logAuditEvent('SEARCH_CLICK', { criteria: searchCriteria });
        setNotification({ message: '', type: '' });
        setSearchResult(null);
        setIsLoading(true);

        if (!isSearchEnabled) {
            setNotification({ message: 'Please enter valid search criteria.', type: 'error' });
            setIsLoading(false);
            return;
        }

        try {

            let payload = { ...searchCriteria };

            // --- CUSTOM DL LOGIC START ---
            if (payload.dlNumber) {
                // 1. Clean spaces from the input (e.g. "M 620 793" -> "M620793")
                const rawInput = payload.dlNumber.replace(/\s+/g, '');

                if (rawInput.length > 1) {
                    // 2. Extract First Char (e.g. "M") & Body (e.g. "620793...")
                    const firstChar = rawInput.charAt(0);
                    const bodyNumbers = rawInput.substring(1);

                    // 3. Construct the Source: 'MD' + First Char
                    // Example: 'MD' + 'M' = 'MDM'
                    // Example: 'MD' + '-' = 'MD-'
                    payload.dlState = 'MD' + firstChar;

                    // 4. Set the Number to the remaining digits
                    payload.dlNumber = bodyNumbers;
                }
            }

            const response = await searchIdentRecords(payload);

            // 2. Adapt API Response (Page) to UI State (MatchType)

            // CASE A: No Records
            if (!response || !response.content || response.content.length === 0) {
                setNotification({ message: '*NO EXACT MATCHED RECORD ON FILE. YOU MAY MODIFY IDENTIFIERS AND RE-ENTER', type: 'error' });
                setIsLoading(false);
                return;
            }

            // CASE B: Exact Match (1 Record)
            // Requirement: Fetch full details immediately for the Detail View
            if (response.totalElements === 1) {
                const systemId = response.content[0].systemId;
                try {
                    const fullDetail = await getIdentDetail(systemId);
                    setSearchResult({
                        matchType: 'EXACT',
                        data: [fullDetail] // Wrap in array for consistency
                    });
                } catch (detailErr) {
                    setNotification({ message: 'Error retrieving details for the record.', type: 'error' });
                }
            }
            // CASE C: Multiple Matches
            else {
                setSearchResult({
                    matchType: 'MULTIPLE',
                    data: response.content
                });
            }

        } catch (err) {
            if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                setIsLoading(false);
                return; // Stop here, let the App redirect to Login
            }
            setNotification({ message: 'An error occurred during the search. Please check the API connection.', type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    // This handles updates from the Details Modal (e.g. after edit)
    const handleRecordUpdate = (updatedRecord) => {
        if (updatedRecord._isDeleted) {
            setDisplayResults(prevResults =>
                prevResults.filter(record => record.sidNumber !== updatedRecord.sid) // Note: using sidNumber for list
            );
            if (updatedRecord.successMessage) {
                setNotification({ message: updatedRecord.successMessage, type: 'success' });
            }
        } else {
            setDisplayResults(prevResults =>
                prevResults.map(record =>
                    record.sidNumber === updatedRecord.sid ? { ...record, ...updatedRecord } : record
                )
            );
        }
    };

    const renderResults = () => {
        if (isLoading) return <div className="loading-indicator">Searching...</div>;
        if (!searchResult) return null;

        switch (searchResult.matchType) {
            case 'EXACT':
                const handleBackFromSingle = () => {
                    setSearchResult(null);
                    const successMessage = sessionStorage.getItem('expungementSuccessMessage');
                    if (successMessage) {
                        setNotification({ message: successMessage, type: 'success' });
                        sessionStorage.removeItem('expungementSuccessMessage');
                    }
                };
                // Pass the full enriched object to DetailsView
                return <DetailsView
                    data={searchResult.data[0]}
                    backToSearch={handleBackFromSingle}
                    onRecordUpdate={handleRecordUpdate}
                />;

            case 'MULTIPLE':
                return <SearchResultsTable
                    results={displayResults}
                    backToSearch={() => setSearchResult(null)}
                    onRecordUpdate={handleRecordUpdate}
                    notificationMessage={notification}
                />;
            default:
                return null;
        }
    };

    return (
        <div className="search-page-container">
            <div className="header-bar">
                <div className="header-logo" />
                <div className="profile-menu">
                    <button className="profile-button" onClick={() => setIsDropdownVisible(!isDropdownVisible)} onBlur={() => setTimeout(() => setIsDropdownVisible(false), 200)} aria-haspopup="true" aria-expanded={isDropdownVisible}>
                        <UserIcon /> <span>{user.username}</span> <div className="profile-caret">▼</div>
                    </button>
                    {isDropdownVisible && (<div className="profile-dropdown" role="menu"><button onClick={logout} role="menuitem">Logout</button></div>)}
                </div>
            </div>

            <div className="search-content-area">
                {searchResult ? renderResults() : (
                    <div className="search-form-container">
                        <div className="form-title-container">
                            <img src={dpscsLogo} alt="DPSCS Seal" className="form-title-logo" />
                            <h2 className="form-title">MD CJIS CENTRAL REPOSITORY IDENTIFICATION INDEX INQUIRY</h2>
                        </div>

                        {notification.message && (
                            <div className={`notification-banner ${notification.type}`} role="alert">
                                {notification.message}
                            </div>
                        )}

                        <form onSubmit={handleSearch}>
                            <div className="form-grid">

                                {/* Row 1 */}
                                <div className="form-group">
                                    <label htmlFor="typeOfRequest">TYPE OF REQUEST:</label>
                                    <select id="typeOfRequest" name="typeOfRequest" value={searchCriteria.typeOfRequest} onChange={handleChange}>
                                        <option value="">-- Select --</option>
                                        <option value="SDX">SDX (Soundex)</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="fullName">FULL NAME:</label>
                                    <input
                                        id="fullName" type="text" name="fullName"
                                        value={searchCriteria.fullName} onChange={handleChange}
                                        placeholder="Doe, John"
                                        className={errors.fullName ? 'input-error' : ''}
                                    />
                                    {errors.fullName && <span className="field-error-text" role="alert">{errors.fullName}</span>}
                                </div>

                                {/* Row 2 */}
                                <div className="form-group">
                                    <label htmlFor="dob">DOB:</label>
                                    <input
                                        id="dob" type="text" name="dob"
                                        value={searchCriteria.dob} onChange={handleChange}
                                        placeholder="MM/DD/YYYY or YYYY" maxLength="10"
                                        className={errors.dob ? 'input-error' : ''}
                                    />
                                    {errors.dob && <span className="field-error-text" role="alert">{errors.dob}</span>}
                                </div>
                                <div className="form-group">
                                    <label htmlFor="sid">SID NUMBER:</label>
                                    <input
                                        id="sid" type="text" name="sid"
                                        value={searchCriteria.sid} onChange={handleChange}
                                        disabled={isSdxMode} // Disabled for SDX
                                    />
                                </div>

                                {/* Row 3 (FBI Added Here) */}
                                <div className="form-group">
                                    <label htmlFor="ssn">SOCIAL SECURITY NUMBER:</label>
                                    <input
                                        id="ssn" type="text" name="ssn"
                                        value={searchCriteria.ssn} onChange={handleChange}
                                        placeholder="XXX-XX-XXXX" maxLength="11"
                                        disabled={isSdxMode} // Disabled for SDX
                                        className={errors.ssn ? 'input-error' : ''}
                                    />
                                    {errors.ssn && <span className="field-error-text" role="alert">{errors.ssn}</span>}
                                </div>
                                <div className="form-group">
                                    <label htmlFor="fbiNumber">UCN / FBI NUMBER:</label>
                                    <input
                                        id="fbiNumber" type="text" name="fbiNumber"
                                        value={searchCriteria.fbiNumber} onChange={handleChange}
                                        disabled={isSdxMode} // Disabled for SDX
                                        className={errors.fbiNumber ? 'input-error' : ''}
                                    />
                                    {errors.fbiNumber && <span className="field-error-text" role="alert">{errors.fbiNumber}</span>}
                                </div>

                                <div className="form-group">
                                    <label htmlFor="dlNumber">MD DRIVERS LICENSE:</label>
                                    <input
                                        id="dlNumber"
                                        type="text"
                                        name="dlNumber"
                                        value={searchCriteria.dlNumber}
                                        onChange={handleChange}
                                        disabled={isSdxMode} // Legacy: Not allowed in SDX
                                        placeholder="License Number"
                                        className={errors.dlNumber ? 'input-error' : ''}
                                    />
                                    {errors.dlNumber && <span className="field-error-text"  role="alert">{errors.dlNumber}</span>}
                                </div>

                                {/* Row 4 */}
                                <div className="form-group">
                                    <label htmlFor="race">RACE:</label>
                                    <select id="race" name="race" value={searchCriteria.race} onChange={handleChange} disabled={isSdxMode}>
                                        <option value="">-- Select --</option>
                                        {raceOptions.map(opt => (
                                            <option key={opt.code} value={opt.code}>{`${opt.code} - ${opt.description}`}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="sex">SEX:</label>
                                    <select id="sex" name="sex" value={searchCriteria.sex} onChange={handleChange} disabled={isSdxMode}>
                                        <option value="">-- Select --</option>
                                        {sexOptions.map(opt => (
                                            <option key={opt.code} value={opt.code}>{`${opt.code} - ${opt.description}`}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="form-buttons">
                                <button type="submit" className="search-button" disabled={isLoading || !isSearchEnabled}>
                                    {isLoading ? 'Searching...' : 'Search'}
                                </button>
                                <button type="button" className="clear-button" onClick={handleClear} disabled={isFormEmpty}>Clear</button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SearchPage;