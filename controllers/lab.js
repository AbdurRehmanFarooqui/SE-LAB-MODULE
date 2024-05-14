const path = require('path')
const executeQuery = require('../functions/executeQuery')
const sql = require('mssql');
// const{Configuration,OpenAIApi}=require('openai')
// const{OpenAI}=require('openai')
// const openai = new OpenAI({
//     apiKey: process.env['OPENAI_API_KEY'], // This is the default and can be omitted
//   });

//   console.log(process.env['OPENAI_API_KEY'])
// const config= new Configuration({
//     apiKey:"sk-proj-Rrfq1c2ivkLb9Rx23sXJT3BlbkFJCfywY3Z9fhkAnUvcaUur"
// });

// const openai=new OpenAIApi(config);



const enterPrescription = (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'lab', 'html', 'Prescription_login.html'));
}

const viewTests = (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'lab', 'html', 'View_tests.html'));
}

const viewInvoice = (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'lab', 'html', 'Invoice.html'));
}



const totalcostbyid= async (req, res) => {
    const _id = req.params.id
    const query = "SELECT dbo.GetTotalTestCost" + "(" + _id + ") AS TotalCost;"

    try {
        executeQuery(query)
            .then(rows => {

                res.send(rows)

            })
            .catch(error => {
                // Handle any errors
                console.error('Error executing query:', error);
                res.send(error).status(400)
            });
    }
    catch (e) {
        res.send(e).status(500)
    }
};


const formatDate = (date) => {
    const pad = (number, length = 2) => {
        return number.toString().padStart(length, '0');
    };

    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());
    const milliseconds = pad(date.getMilliseconds(), 3);

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;
};



const insertinvoice = async (req, res) => {

    const prescriptionId=req.params.id
    const now = new Date();
    const collectionTime = formatDate(now);
   

  
    try {
        const totalCostQuery = `SELECT dbo.GetTotalTestCost(${req.params.id}) AS TotalCost`;
        executeQuery(totalCostQuery)
            .then(rows => {

                 const amount=rows[0].TotalCost;
                console.log(rows[0].TotalCost);
                console.log(rows);
                const query = `
                DECLARE @InsertedTestID INT;
                EXEC InsertInvoiceAndTestOrder ${amount}, ${prescriptionId}, '${collectionTime}', @InsertedTestID OUTPUT;
                SELECT 'Test ID:', @InsertedTestID AS TestID;
            `;
            console.log(query)
                executeQuery(query).then(row1=>{
                    res.send(row1)
                console.log(row1)
                })
               // to redirect to html page after success 
               // res.redirect('/html')

            })
        

            .catch(error => {

                console.error('Error executing query:', error);
                res.send(error).status(400)
            });

    }
    catch (e) {
        res.send(e).status(500)
    }
};



const prescriptiondetail = async (req, res) => {
    const _id = req.params.id;
    const query = `SELECT * FROM GetPrescriptionDetails(${_id})`;
    console.log(query);
  
    try {
      const rows = await executeQuery(query);
  
      if (rows.length === 0 || (rows[0].PatientName && rows[0].PatientName === 'No ID found')) {
        console.log('No data found for the provided ID');
        res.status(404).send('No data found for the provided ID');
      } else {
        // Initialize an empty object to store grouped data
        const groupedData = {};
  
        // Iterate through the rows
        rows.forEach(row => {
          const key = `${row.PatientName}-${row.PrescriptionDate}-${row.DoctorName}-${row.PrescriptionID}`;
  
          // If the key doesn't exist in groupedData, create it
          if (!groupedData[key]) {
            groupedData[key] = {
              PatientName: row.PatientName,
              PrescriptionDate: row.PrescriptionDate,
              DoctorName: row.DoctorName,
              PrescriptionID:row.PrescriptionID,
              Tests: [] // Array to store tests
            };
          }
  
          // Add test details to the Tests array
          groupedData[key].Tests.push({
            TestName: row.TestName,
            TestCost: row.TestCost
          });
        });
  
        // Convert groupedData object into an array of values
        const result = Object.values(groupedData);
  
        res.status(200).send(result);
      }
    } catch (error) {
      console.error('Error executing query:', error);
      res.status(500).send('Internal Server Error');
    }
  };

 const inprogressssample = async (req, res) => {
  
    const query = "SELECT SampleID, Testname FROM dbo.GetSamplesInProgress();";
    console.log(query);
    
    try {
        executeQuery(query)
            .then(rows => {
                res.send(rows).status(200)
               
           
            })
            .catch(error => {
                console.error('Error executing query:', error);
                res.send(error).status(400);
            });
    } catch (e) {
        console.error('Error:', e);
        res.send(e).status(500);
    }
};



const inpendingsample = async (req, res) => {
  
    const query = "SELECT SampleID, Testname FROM dbo.GetSamplesInPending();";
    console.log(query);
    
    try {
        executeQuery(query)
            .then(rows => {
                res.send(rows).status(200)
               
           
            })
            .catch(error => {
                console.error('Error executing query:', error);
                res.send(error).status(400);
            });
    } catch (e) {
        console.error('Error:', e);
        res.send(e).status(500);
    }
};


const incompeleteresult=async (req, res) => {
  
    const query = "SELECT * FROM dbo.GetNullFieldResults();";
    console.log(query);
    
    try {
        executeQuery(query)
            .then(rows => {
                res.send(rows).status(200)
               
           
            })
            .catch(error => {
                console.error('Error executing query:', error);
                res.send(error).status(400);
            });
    } catch (e) {
        console.error('Error:', e);
        res.send(e).status(500);
    }
};


const inserttestresult = async (req, res) => {

    const query = "EXEC UpdateLabResultWithTimestamp @SampleID =" +req.params.sampleid+", @FieldID = "+req.params.fieldid+", @NewValue = "+req.params.value+";";
    console.log(query)
    try {
        executeQuery(query)
            .then(rows => {


                res.send(rows)
                console.log(rows)

               // to redirect to html page after success 
               // res.redirect('/html')

            })
            .catch(error => {

                console.error('Error executing query:', error);
                res.send(error).status(400)
            });
    }
    catch (e) {
        res.send(e).status(500)
    }
};


// const ai=async(req,res)=>{
//  const prompt="urine glouses test value 5 write in very short what is it good or bad if it bad write very short what precaution should I use to get rid of it";
//  const response=await openai.createCompletion({
//     model:"text-davinci-003",
//     prompt:prompt,
//     max_tokens:2048,
//     temperature:1,
//  });
//  console.log(res.data);
// }

// ai();

// const ai = async (req, res) => {
//     const params = {
//       messages: [{ role: 'user', content: 'urine glouses test value 5 write in very short what is it good or bad if it bad write very short what precaution should I use to get rid of it' }],
//       model: 'gpt-3.5-turbo',
//     };
  
//     try {
//       const chatCompletion = await openai.chat.completions.create(params);
//       res.status(200).json(chatCompletion);
//       console.log(chatCompletion)
//     } catch (error) {
//       console.error('Error creating chat completion:', error);
//       res.status(500).json({ error: 'Internal Server Error' });
//     }
//   };

//   ai();

module.exports = {
    enterPrescription,
    viewTests,
    viewInvoice,
    inprogressssample,
    prescriptiondetail,
    totalcostbyid,
    insertinvoice,
    inpendingsample,
    incompeleteresult,
    inserttestresult
 
}