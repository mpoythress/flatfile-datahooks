/*
Dependencies...
    - zcs@1.0.2
    - us-zips@2021.11.4✕


DESCRIPTION
This Data Hook will try to populate missing city, state, or zip info using the data that *is* available.
All lookups are against arrays brought in by dependency packages, so no API calls are used, 
making the process very fast.

TEMPLATE FIELDS REFERENCED
    - Origincity
    - OriginState
    - OriginZip

*/

const usZips = require('us-zips')
const { getByStateCity, getByCityState, getByZip, zipLookAhead, cityLookAhead, stateLookAhead } = require('zcs')


const isNil = (val) => val === null || val === undefined || val === "";
const isNotNil = (val) => !isNil(val);


module.exports = async ({recordBatch, session, logger}) => {  

  for (let recordIndex = 0; recordIndex < recordBatch.records.length; recordIndex++) {
    const record = recordBatch.records[recordIndex];
    logger.info("row" + recordIndex)
    // Origin city/state/zip healer
        /*

        - zip has highest credibility
        - if 2 elements match (city + state, city + zip, state + zip), the match wins
        - when only 1 element disagrees, ignore that for calcs and addError

        1 - zip, missing city state
        2 - city + state, missing zip
        3 - zip + state, missing city
        4 - zip + city, missing state
        5 - city + state + zip
        6 - bad city state

        */


        zipData = null
        zip3 = null
        zip3data = null
        cityData = null
        

        if(record.get('OriginZip').length == 3) {
            try {
                zip3data = zipLookAhead(record.get('OriginZip'), 1)
                record.addInfo('OriginZip', "Auto-calculated from an uploaded value of " + record.get('OriginZip'))
                record.set('OriginZip', String(zip3data))
            } catch {
                logger.info("Failed at initial Origin zip3data")
            }
            
        }
        
        // 1-zip, missing city and state
        if( isNotNil(record.get('OriginZip')) && isNil(record.get('Origincity')) && isNil(record.get('OriginState')) ){
            try {
                var zipData = getByZip(record.get('OriginZip'))
            } catch (e) {
                var zip3 = record.get('OriginZip').substring(0,3)
                logger.info("zip " + record.get('OriginZip') + " not found, reverting to zip3 (" + zip3 + ")")
            }
            if( isNotNil(zip3) ) {
                zip3data = zipLookAhead(zip3, 1)
                zipData = getByZip(zip3data)
                logger.info(zipData)
            }
            if( typeof zipData === 'object' ) {
                logger.info(zipData)
                record.set('Origincity', zipData.city)
                record.addInfo('Origincity', "Auto-populated from zip code")
                record.set('OriginState', zipData.state)
                record.addInfo('OriginState', "Auto-populated from zip code")
            }
        }

        // 2-city & state, missing zip
        if( isNil(record.get('OriginZip')) && isNotNil(record.get('Origincity')) && isNotNil(record.get('OriginState')) ){
            try {
                var zipData = getByCityState(record.get('Origincity'), record.get('OriginState'),1)
                logger.info(zipData)
            } catch {
                logger.info("#2 - city & state - no match found")
            }
            
            if( isNotNil(zipData) && isNotNil(zipData[0]) ) {
                record.set('OriginZip', zipData[0])
                record.addInfo('OriginZip', "Auto-populated city+state")
            } else {
                record.addError('OriginZip', "Unable to determine zip based on city/state")
            }
        }

        // 3-zip + state, missing city
        if( isNotNil(record.get('OriginZip')) && isNil(record.get('Origincity')) && isNotNil(record.get('OriginState')) ){
            try {
                var zipData = getByZip(record.get('OriginZip'))
                logger.info(zipData)
            } catch (e) {
                logger.info("zip " + record.get('OriginZip') + " not found, unable to determine city based on zip + state")
                record.addError('Origincity', "Unable to determine city based on zip and state")
            }
            if( typeof zipData === 'object' && isNotNil(zipData) ) {
                if(zipData.state == record.get('OriginState').toUpperCase()) {
                    record.set('Origincity', zipData.city)
                    record.addInfo('Origincity', "Auto-populated from state and zip code")
                } else {
                    record.addError('Origincity', "Unable to determine city based on zip and state")
                }
            }
        }

        // 4-zip + city, missing state
        if( isNotNil(record.get('OriginZip')) && isNotNil(record.get('Origincity')) && isNil(record.get('OriginState')) ){
            try {
                var zipData = getByZip(record.get('OriginZip'))
            } catch (e) {
                var zip3 = record.get('OriginZip').substring(0,3)
                logger.info("zip " + record.get('OriginZip') + " not found, reverting to zip3 (" + zip3 + ")")
            }
            if( isNotNil(zip3) ) {
                zip3data = zipLookAhead(zip3, 1)
                zipData = getByZip(zip3data)
                logger.info(zipData)
            }
            if( typeof zipData === 'object' ) {
                logger.info(zipData)
                var cityData = getByCityState(record.get('Origincity'), zipData.state)
                if(isNotNil(cityData) ) {
                    record.set('OriginState', zipData.state)
                    record.addInfo('OriginState', "Auto-populated from city and zip code")
                } else {
                    record.addError('OriginState', "Unable to determine state based on zip and city")
                }
            }
        }

        // 5-city + state + zip
        if( isNotNil(record.get('OriginZip')) && isNotNil(record.get('Origincity')) && isNotNil(record.get('OriginState')) ){
            try {
                var zipData = getByZip(record.get('OriginZip'))
            } catch (e) {
                var zip3 = record.get('OriginZip').substring(0,3)
                logger.info("zip " + record.get('OriginZip') + " not found, reverting to zip3 (" + zip3 + ")")
            }
            if( isNotNil(zip3) ) {
                zip3data = zipLookAhead(zip3, 1)
                zipData = getByZip(zip3data)
                logger.info(zipData)
            }

            try {
                var cityData = getByCityState(record.get('Origincity'), record.get('OriginState'))
                logger.info(cityData)
            } catch {
                logger.info("#5 - city & state - no match found")
            }
            if(isNil(cityData) ) {
                logger.info("No match found for city/state")
                record.addError('OriginState', "No match found for city/state")
                record.addError('Origincity', "No match found for city/state")
            }
            if( typeof zipData === 'object' && isNotNil(zipData) ) {
                if(zipData.state != record.get('OriginState').toUpperCase() && 
                    zipData.city != record.get('Origincity').toUpperCase()) {
                    logger.info("Zip does not match city or state")
                    record.addError('OriginZip', "Zip does not match city or state")
                }
            }

        }


    };

};
