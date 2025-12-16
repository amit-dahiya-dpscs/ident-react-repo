import React, { createContext, useState, useContext, useEffect } from 'react';
import { apiClient } from '../services/api';

// Create the context object
const ReferenceDataContext = createContext(null);

/**
 * This provider component will wrap our application. It fetches all necessary
 * lookup data when the app first loads and makes it available to all children.
 */
export const ReferenceDataProvider = ({ children }) => {
    // State to hold our lookup data
    const [countries, setCountries] = useState([]);
    const [cautionCodes, setCautionCodes] = useState({}); // Use an object for fast lookups
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // This effect runs only once when the application mounts
    useEffect(() => {
        // Create an async function to fetch all our reference data in parallel
        const fetchAllReferenceData = async () => {
            try {
                // Use Promise.all to make API calls concurrently for better performance
                const [countriesResponse, cautionsResponse] = await Promise.all([
                    apiClient.get('/reference/countries'),
                    apiClient.get('/reference/cautions')
                ]);

                setCountries(countriesResponse.data || []);
                setCautionCodes(cautionsResponse.data || {});

            } catch (err) {
                console.error("Failed to fetch critical reference data:", err);
                setError("Could not load necessary application data. Please try again later.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchAllReferenceData();
    }, []); // The empty dependency array ensures this runs only once

    // The value that will be provided to all consuming components
    const value = {
        countries,
        cautionCodes,
        isLoading,
        error
    };

    // If there was a critical error fetching data, we can show an error message
    // instead of rendering a broken application.
    if (error) {
        return <div className="global-error-fullscreen">{error}</div>;
    }

    // While loading, we can show a loader (or nothing) to prevent rendering
    // components that depend on this data before it's ready.
    if (isLoading) {
        return <div className="global-loader"></div>; // Assumes a global loader style exists
    }

    return (
        <ReferenceDataContext.Provider value={value}>
            {children}
        </ReferenceDataContext.Provider>
    );
};

/**
 * A custom hook that provides a simple way for components to access the reference data.
 */
export const useReferenceData = () => {
    const context = useContext(ReferenceDataContext);
    if (context === undefined) {
        throw new Error('useReferenceData must be used within a ReferenceDataProvider');
    }
    return context;
};