import React, { useEffect, useState } from 'react';
import { EditSection } from './edit/EditSection';
import Pagination from './ui/Pagination'; 
import './DetailsView.css';
import dpscsLogo from '../assets/maryland_seal.png';

// --- HELPER: Assign Priority for Sorting ---
// 1 = Criminal (Default / Top)
// 2 = Non-Reportable (MAF, CIT)
// 3 = Non-Criminal (Applicant, Civil)
const getReferencePriority = (docType) => {
    if (!docType) return 1;
    const type = docType.toUpperCase();

    // Group B: Non-reportable Criminal
    const nonReportable = ['MAF', 'CIT'];
    
    // Group C: Non-Criminal / Applicant / Civil
    // (Add any other applicant codes here if needed like APP, CIV)
    const nonCriminal = ['ADO','AFB','AGE','AIN','APF','APL','APP','APR','APS','ATT','CCD','CCF','CJF','CJS','DCA','DCB','DCC','DCD','DCE','DCF','DCG','DCH','DCI','DCM','DCO','DCQ','DCR','DCS','DCW','DCX','DCY','DCZ','DEK','DEU','DJS','EMP','FAD','FFR','GPN','GPR','GPT','GPU','GVL','GVS','HAZ','IDV','LQF','LQM','MGN','MPR','PDL','PDT','PMD','PSC','RCS','REV','SPA','SPC','SPN','SPR','VIS']; 

    // Group D
    const consolidated = ['XRF', 'CNS'];

    if (nonReportable.includes(type)) return 2;
    if (nonCriminal.includes(type)) return 3;
    if (consolidated.includes(type)) return 4;
    
    // Group A: Everything else is treated as "Criminal"
    return 1;
};

// --- INTERNAL HELPER: Handles Pagination Logic ---
const PaginatedList = ({ 
    title, 
    items = [], 
    renderItem, 
    initialPageSize = 5, 
    showDropdown = false,
    isTable = false,
    isCard = true, 
    renderTableHeaders,
    renderTableRow
}) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(initialPageSize);

    useEffect(() => { setCurrentPage(1); }, [items]);

    const totalPages = Math.ceil(items.length / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const currentItems = items.slice(startIndex, startIndex + pageSize);

    const handlePageSizeChange = (newSize) => {
        setPageSize(newSize);
        setCurrentPage(1);
    };

    // --- 1. TABLE MODE (Reference Section) ---
    if (isTable) {
        return (
            <div className="section-panel">
                {title && <div className="section-header"><h3>{title}</h3></div>}
                <div className="section-content">
                    <div className="table-wrapper">
                        <table className="details-table">
                            <thead>{renderTableHeaders()}</thead>
                            <tbody>
                                {currentItems.length > 0 ? (
                                    currentItems.map((item, index) => renderTableRow(item, index))
                                ) : (
                                    <tr><td colSpan="100%" className="no-data">No records found</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <Pagination 
                        currentPage={currentPage} 
                        totalPages={totalPages} 
                        onPageChange={setCurrentPage} 
                        pageSize={pageSize} 
                        onPageSizeChange={showDropdown ? handlePageSizeChange : undefined}
                        pageSizeOptions={[10, 25, 50, 100]}
                    />
                </div>
            </div>
        );
    }

    // --- 2. LIST MODE (Alias & Appended-ID) ---
    const wrapperClass = isCard ? "section-panel sub-section" : "pagination-scope-minimized";

    return (
        <div className={wrapperClass}>
             {isCard && title && <div className="section-header"><h3>{title}</h3></div>}
             
             <div className={isCard ? "section-content" : ""}>
                <div className="details-list">
                    {currentItems.length > 0 ? (
                        currentItems.map((item, index) => (
                            <span key={index}>
                                {renderItem(item)}
                            </span>
                        ))
                    ) : (
                        <div className="no-data">No records found</div>
                    )}
                </div>
                
                {/* FIX APPLIED HERE:
                    1. Changed condition to 'items.length > 0' (Show even if only 1 page)
                    2. Passed 'onPageSizeChange' to force Pagination.js to render (bypassing its 'null' check)
                    3. The CSS (.sub-section .page-size-selector { display: none }) will hide the dropdown.
                */}
                {items.length > 0 && (
                    <Pagination 
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        pageSize={pageSize}
                        onPageSizeChange={handlePageSizeChange} // Forces render
                    />
                )}
             </div>
        </div>
    );
};

const DetailItem = ({ label, value, className = '' }) => (
    <div className={`detail-item ${className}`}>
        <span className="detail-label">{label}:</span>
        <span className="detail-value">{value || '--'}</span>
    </div>
);

const DetailsView = ({ data, backToSearch, onClose }) => {
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (data) {
            // 1. Combine all document lists
            const combinedDocs = [
                ...(data.arrestDocuments || []),
                ...(data.indexDocuments || []),
                ...(data.generalReferences || [])
            ];

            // 2. Apply the Grouping + Sorting Logic
            combinedDocs.sort((a, b) => {
                // First, Sort by Group Priority (1, 2, 3)
                const priorityA = getReferencePriority(a.documentType);
                const priorityB = getReferencePriority(b.documentType);
                
                if (priorityA !== priorityB) {
                    return priorityA - priorityB; // Ascending (1 -> 2 -> 3)
                }
                
                // Second, Sort by Date Descending within the same group
                // (Assumes date format YYYY-MM-DD or MM/DD/YYYY)
                const dateA = new Date(a.documentDate);
                const dateB = new Date(b.documentDate);
                return dateB - dateA;
            });

            // 3. Create a new data object with the sorted 'allReferences' attached
            // We store it in a temporary property 'sortedReferences' for the UI to use
            setDetails({ ...data, sortedReferences: combinedDocs });
            setLoading(false);
        } else if (onClose) { 
             setLoading(false); 
        }
    }, [data, onClose]);

    if (loading) return <div className="loading-spinner">Loading...</div>;
    if (!details) return null;

    const primaryName = details.namesAndAliases?.find(n => n.nameType === 'P') || details.namesAndAliases?.[0] || {};
    
    // Use the sorted list we created in useEffect
    const displayReferences = details.sortedReferences || [];

    return (
        <div className="details-view-container">
            <div className="details-header">
                <div className="details-title-container">
                    <img src={dpscsLogo} alt="DPSCS Seal" className="details-title-logo" />
                    <h2>MD CJIS CENTRAL REPOSITORY IDENTIFICATION / INDEX INQUIRY DETAILS</h2>
                </div>
                {backToSearch && !onClose && (
                    <button className="back-button" onClick={backToSearch}>Back to Search</button>
                )}
            </div>

            <div className="details-scroll-area">
                
                <EditSection title="NAME" isOpen={true} canEdit={false}> 
                    <div className="details-grid top-section-grid ident-layout">
                        <div className="detail-item-name">
                            <DetailItem label="NAME" value={`${primaryName.lastName}, ${primaryName.firstName} ${primaryName.middleName || ''}`} />
                        </div>
                        <DetailItem label="FBI / UCN" value={details.fbiNumber} />
                        <DetailItem label="SID" value={details.sid} />
                        <div className="detail-item-record-type">
                            <DetailItem label="RECORD TYPE" value={details.recordType} />
                        </div>
                    </div>
                </EditSection>

                <EditSection title="PERSONAL IDENTIFIERS" isOpen={true} canEdit={false}>
                    <div className="details-grid personal-identifiers-grid">
                        <DetailItem label="RACE" value={details.race} />
                        <DetailItem label="SEX" value={details.sex} />
                        <DetailItem label="DOB" value={primaryName.dateOfBirth} />
                        <DetailItem label="POB" value={details.placeOfBirth} />
                        <DetailItem label="HGT" value={details.height} />
                        <DetailItem label="WGT" value={details.weight} />
                        <DetailItem label="EYES" value={details.eyeColor} />
                        <DetailItem label="HAIR" value={details.hairColor} />
                        <DetailItem label="SKIN" value={details.skinTone} />
                        <div className="span-two-columns">
                            <DetailItem label="CAUTION" value={details.cautionFlag} className="text-danger" />
                        </div>
                    </div>
                    <h4 className="sub-section-title">FINGERPRINT CLASSIFICATIONS</h4>
                    <div className="details-grid fingerprint-grid">
                        <DetailItem label="PATTERN TYPE (RIGHT)" value={details.patternRight || '\\\\\\\\'} />
                        <DetailItem label="PATTERN TYPE (LEFT)" value={details.patternLeft || '////w'} />
                    </div>
                    <h4 className="sub-section-title">ADDRESS</h4>
                    {details.addressHistory?.[0] && (
                        <>
                            <div className="details-grid address-grid">
                                <DetailItem label="STREET NUMBER" value={details.addressHistory[0].streetNumber} />
                                <DetailItem label="STREET DIR" value={details.addressHistory[0].streetDirection} />
                                <DetailItem label="STREET NAME" value={details.addressHistory[0].streetName} />
                                <DetailItem label="SUF" value={details.addressHistory[0].streetSuffix} />
                            </div>
                            <div className="details-grid city-state-zip-grid">
                                <DetailItem label="CITY" value={details.addressHistory[0].city} />
                                <DetailItem label="STATE" value={details.addressHistory[0].state} />
                                <DetailItem label="ZIP" value={details.addressHistory[0].zip} />
                                <DetailItem label="COUNTRY OF CITIZENSHIP" value={details.citizenship} />
                            </div>
                        </>
                    )}
                     <h4 className="sub-section-title">COMMENT</h4>
                     <textarea className="comment-textarea" value={details.comments || ''} readOnly rows="3" />
                </EditSection>

                <EditSection title="ALIAS-NAME" isOpen={false} canEdit={false}>
                    <PaginatedList 
                        items={details.namesAndAliases?.filter(n => n.nameType !== 'P')}
                        renderItem={(item) => `${item.lastName}, ${item.firstName} ${item.middleName || ''}`}
                        initialPageSize={5}
                        isCard={false}
                    />
                </EditSection>

                <EditSection title="APPENDED-ID" isOpen={false} canEdit={false}>
                    <div className="appended-id-grid-container">
                        <PaginatedList title="CAUTION" items={details.flags?.filter(f => f.type === 'CAUTION')} renderItem={i => `${i.code} - ${i.description}`} isCard={true} />
                        <PaginatedList title="DOB" items={details.alternateDOBs} renderItem={i => i.dob} isCard={true} />
                        <PaginatedList title="SCAR/MARK" items={details.scarsAndMarks} renderItem={i => `${i.code} ${i.description}`} isCard={true} />
                        <PaginatedList title="SOC-SEC" items={details.ssnHistory} renderItem={i => i.ssn} isCard={true} />
                        <PaginatedList title="MISC-NUMBER" items={details.secondaryIdentifiers} renderItem={i => `${i.idValue}`} isCard={true} />
                    </div>
                </EditSection>

                <EditSection title="REFERENCE" isOpen={false} canEdit={false}>
                    <PaginatedList 
                        items={displayReferences}
                        initialPageSize={10}
                        showDropdown={true}
                        isTable={true}
                        renderTableHeaders={() => (
                            <tr><th>DATE</th><th>TYPE</th><th>NUMBER</th><th>DESCRIPTION</th></tr>
                        )}
                        renderTableRow={(item, idx) => (
                            <tr key={idx}>
                                <td>{item.documentDate}</td>
                                <td>{item.documentType}</td>
                                <td>{item.documentNumber}</td>
                                <td>{item.description}</td>
                            </tr>
                        )}
                    />
                </EditSection>

            </div>
        </div>
    );
};

export default DetailsView;