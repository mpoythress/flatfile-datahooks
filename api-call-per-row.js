/*
Dependencies...
    - axios@0.27.2

*/

const pc_miler_key = "CHANGE_ME"

module.exports = async ({recordBatch, session, logger}) => {  

    for (let recordIndex = 0; recordIndex < recordBatch.records.length; recordIndex++) {
      const record = recordBatch.records[recordIndex];

        // Now we calc miles

        recordOriginZip = null
        recordDestinationZip = null
        zip3data = null

        if (isNotNil(record.get('OriginZip')) && isNotNil(record.get('DestinationZip'))) {
      
        if(record.get('OriginZip') !== ""){
            recordOriginZip = record.get('OriginZip')
            if(recordOriginZip.length == 3) {
                try {
                    zip3data = zipLookAhead(recordOriginZip, 1)
                    recordOriginZip = zip3data
                } catch {
                    logger.info("Failed at record calc miles originzip")
                }
                
            }
            
            var origin_zip = usZips[recordOriginZip]
            if(typeof origin_zip === 'object') {
            var origin_zip_coords = origin_zip.longitude + ',' + origin_zip.latitude
            }
        }

        if(record.get('DestinationZip') !== ""){
            recordDestinationZip = record.get('DestinationZip')
            if(recordDestinationZip.length == 3) {
                try {
                    zip3data = zipLookAhead(recordDestinationZip, 1)
                    recordDestinationZip = zip3data
                } catch {
                    logger.info("Failed at record calc miles destinationzip")
                }
                
            }
                        
            var dest_zip = usZips[recordDestinationZip]
            if(typeof dest_zip === 'object') {
            var dest_zip_coords = dest_zip.longitude + ',' + dest_zip.latitude
            }
        }
        
        if(isNotNil(origin_zip_coords) && isNotNil(dest_zip_coords)){
            var stops = origin_zip_coords + ';' + dest_zip_coords

            try {
            const response = await axios.get('https://pcmiler.alk.com/apis/rest/v1.0/Service.svc/route/routeReports', {
        params: { 
            Reports: 'CalcMiles',
            stops: stops,
            authToken: pc_miler_key
            }}
            );
            
            if(response.data !== null){
                logger.info(Math.round(response.data[0].TMiles));
                //record.addInfo('Client_Miles', "PCMiler reports " + Math.round(response.data[0].TMiles))
                record.set("Echo_Miles", Math.round(response.data[0].TMiles))
            }
              
            } catch (error) {
            logger.info(error);
            }
            // end PCMiler API call

            
        } else {
            record.addInfo('Client_Miles', "No info from PCMiler - missing required coordinates")
            record.set("Echo_Miles", "N/A")
        }

        
        } else {
        record.addInfo('Client_Miles', "Missing zip info required to calculate distance")
        record.set("Echo_Miles", "N/A")
        }


    };

};
