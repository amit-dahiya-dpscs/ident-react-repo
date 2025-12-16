import React, { useState } from 'react';
import Pagination from './ui/Pagination';
import DetailsModal from './ui/DetailsModal';
import './SearchResultsTable.css'; // Reusing your existing CSS
import dpscsLogo from '../assets/maryland_seal.png';
import { logAuditEvent } from '../services/auditService';
import { getIdentDetail } from '../services/api'; // Updated API import

const SearchResultsTable = ({ results, backToSearch, onRecordUpdate, notificationMessage }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [pageSize, setPageSize] = useState(20);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);

  // Pagination Logic
  const totalPages = Math.ceil(results.length / pageSize);
  const currentRecords = results.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  const handleViewClick = async (record) => {
    logAuditEvent('VIEW_DETAIL_CLICK', { sid: record.sidNumber, name: record.formattedName });
    setIsFetchingDetails(true);

    try {
      // Fetch the FULL Ident Index record (with FBI, Aliases, etc.)
      const response = await getIdentDetail(record.systemId);
      setSelectedRecord(response); // Assuming response is the DTO directly
    } catch (error) {
      console.error("Failed to fetch ident details", error);
      // In production, use a toast notification instead of alert
      alert("Could not load full details. Please try again.");
    } finally {
      setIsFetchingDetails(false);
    }
  };

  return (
    <div className="results-container">
      <div className="results-header">
        <div className="results-title-container">
          <img src={dpscsLogo} alt="DPSCS Seal" className="results-title-logo" />
          {/* Updated Title */}
          <h2>MD CJIS CENTRAL REPOSITORY IDENTIFICATION / INDEX SEARCH RESULTS</h2>
        </div>
        <button onClick={backToSearch} className="back-button">Back to Search</button>
      </div>

      {notificationMessage && notificationMessage.message && (
        <div className={`notification-banner ${notificationMessage.type}`} role="alert">
          {notificationMessage.message}
        </div>
      )}

      <div className="table-wrapper">
        <table>
          <thead>
            {/* Columns match your existing Juvenile layout EXACTLY */}
            <tr><th>NAME</th><th>S</th><th>R</th><th>DOB</th><th>PRINT TYPE</th><th>SID</th><th></th></tr>
          </thead>
          <tbody>
            {currentRecords.map((item, index) => (
              <tr key={item.systemId || index}>
                <td>
                  {item.formattedName}
                  {/* Visual hint that this matched name is actually an Alias */}
                  {item.aliasMatch && (
                    <span className="alias-badge" style={{
                      marginLeft: '8px',
                      fontSize: '0.8em',
                      color: '#666',
                      fontStyle: 'italic'
                    }}>
                      (Alias)
                    </span>
                  )}
                </td>
                <td>{item.sex}</td>
                <td>{item.race}</td>
                <td>{item.dateOfBirth}</td>
                {/* Ident Index Backend provides pre-formatted print type string */}
                <td>{item.printType || item.primaryHenry || ''}</td>
                <td>{item.sidNumber}</td>
                <td>
                  <button
                    className="view-link"
                    onClick={() => handleViewClick(item)}
                    disabled={isFetchingDetails}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        pageSize={pageSize}
        onPageSizeChange={handlePageSizeChange}
        pageSizeOptions={[20, 50, 100]}
      />

      {selectedRecord && (
        <DetailsModal
          data={selectedRecord}
          onClose={() => setSelectedRecord(null)}
          onRecordUpdate={onRecordUpdate}
        />
      )}
    </div>
  );
};

export default SearchResultsTable;